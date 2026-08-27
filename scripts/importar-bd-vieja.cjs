/*
 * Pasa el contenido de la base del sistema VIEJO a la base del sistema NUEVO.
 *
 * Uso (desde la raíz del proyecto):
 *   npx electron scripts/importar-bd-vieja.cjs "C:\ruta\vieja.db" "C:\ruta\nueva.db"
 *
 * La base destino tiene que existir y estar con el esquema nuevo: alcanza con
 * haber abierto la app una vez. El script:
 *   1. Guarda una copia de seguridad del destino antes de tocarlo.
 *   2. Borra el contenido del destino (son los productos de ejemplo).
 *   3. Copia los datos de la vieja, columna por columna, quedándose sólo con
 *      las que existen en las dos. Así tolera que los esquemas no coincidan.
 *   4. Aplica las conversiones del sistema nuevo: los egresos que estaban en
 *      la caja pasan a su tabla propia, y los pagos con débito, crédito o
 *      mixto quedan como transferencia.
 *
 * Se corre con electron y no con node porque better-sqlite3 viene compilado
 * para electron.
 */
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const args = process.argv.slice(2).filter((a) => a.endsWith('.db'));
const [rutaVieja, rutaNueva] = args;

function salir(msg) {
  console.error('\n✖ ' + msg + '\n');
  if (process.versions.electron) require('electron').app.exit(1);
  process.exit(1);
}

if (!rutaVieja || !rutaNueva) salir('Uso: importar-bd-vieja.cjs <vieja.db> <nueva.db>');
if (!fs.existsSync(rutaVieja)) salir('No existe la base vieja: ' + rutaVieja);
if (!fs.existsSync(rutaNueva)) salir('No existe la base nueva: ' + rutaNueva + '\n  Abrí la app una vez para que la cree.');

// ---------- 1. Copia de seguridad del destino ----------
const sello = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const backup = rutaNueva.replace(/\.db$/, '') + `.backup-${sello}.db`;
fs.copyFileSync(rutaNueva, backup);
console.log('Copia de seguridad del destino:', backup);

const vieja = new Database(rutaVieja, { readonly: true, fileMustExist: true });
const nueva = new Database(rutaNueva, { fileMustExist: true });

const columnas = (db, tabla) => {
  try {
    return db.prepare(`PRAGMA table_info("${tabla}")`).all().map((c) => c.name);
  } catch { return []; }
};
const existe = (db, tabla) => columnas(db, tabla).length > 0;
const contar = (db, tabla) => {
  try { return db.prepare(`SELECT COUNT(*) n FROM "${tabla}"`).get().n; } catch { return 0; }
};

/**
 * Copia una tabla quedándose con las columnas presentes en las dos bases.
 * `transformar` puede reescribir cada fila antes de insertarla.
 */
function copiar(tabla, { excluir = [], transformar = null, origen = tabla } = {}) {
  if (!existe(vieja, origen) || !existe(nueva, tabla)) {
    console.log(`  ${tabla}: se omite (no está en las dos bases)`);
    return 0;
  }
  const comunes = columnas(vieja, origen)
    .filter((c) => columnas(nueva, tabla).includes(c))
    .filter((c) => !excluir.includes(c));

  if (comunes.length === 0) {
    console.log(`  ${tabla}: se omite (no comparten columnas)`);
    return 0;
  }

  const filas = vieja.prepare(`SELECT * FROM "${origen}"`).all();
  const insert = nueva.prepare(
    `INSERT OR REPLACE INTO "${tabla}" (${comunes.map((c) => `"${c}"`).join(',')})
     VALUES (${comunes.map((c) => '@' + c).join(',')})`,
  );

  let n = 0;
  const tx = nueva.transaction((lista) => {
    for (const cruda of lista) {
      const fila = transformar ? transformar(cruda) : cruda;
      if (!fila) continue;
      const valores = {};
      for (const c of comunes) valores[c] = fila[c] === undefined ? null : fila[c];
      insert.run(valores);
      n++;
    }
  });
  tx(filas);
  console.log(`  ${tabla}: ${n} registros  (columnas: ${comunes.join(', ')})`);
  return n;
}

console.log('\nVieja :', rutaVieja);
console.log('Nueva :', rutaNueva);
console.log('\nContenido de la base vieja:');
for (const t of vieja.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all()) {
  console.log(`  ${t.name}: ${contar(vieja, t.name)}`);
}

// ---------- 2. Vaciar el destino ----------
console.log('\nVaciando la base nueva (tenía los productos de ejemplo)...');
nueva.pragma('foreign_keys = OFF');
for (const t of ['sale_payments', 'sale_items', 'sales', 'expenses', 'products', 'customers', 'suppliers', 'settings']) {
  if (existe(nueva, t)) nueva.prepare(`DELETE FROM "${t}"`).run();
}

// ---------- 3. Copiar ----------
console.log('\nImportando:');

// Primero lo que no depende de nada
copiar('customers');
copiar('suppliers');
copiar('products', { excluir: ['price_card', 'is_favorite', 'favorite_key'] });

// El medio de pago se reduce a efectivo o transferencia
const aMedioNuevo = (m) => (m === 'cash' ? 'cash' : 'transfer');

copiar('sales', {
  excluir: ['cash_register_id'],
  transformar: (f) => ({ ...f, payment_method: aMedioNuevo(f.payment_method) }),
});
copiar('sale_items');
copiar('sale_payments', {
  transformar: (f) => ({ ...f, payment_method: aMedioNuevo(f.payment_method) }),
});

// Los egresos: si la vieja ya tenía tabla propia se usa esa; si no, se
// rescatan los de la caja, que es donde vivían.
if (existe(vieja, 'expenses')) {
  copiar('expenses');
} else if (existe(vieja, 'cash_movements')) {
  const cols = columnas(vieja, 'cash_movements');
  const conMedio = cols.includes('payment_method');
  const filas = vieja.prepare("SELECT * FROM cash_movements WHERE type = 'expense'").all();
  const insert = nueva.prepare(`
    INSERT INTO expenses (type, amount, concept, description, payment_method, date, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const ahora = Math.floor(Date.now() / 1000);
  const tx = nueva.transaction((lista) => {
    for (const m of lista) {
      const fecha = m.created_at || ahora;
      insert.run(
        'business',                       // el sistema viejo no distinguía sueldo
        m.amount,
        m.concept || 'Egreso',
        m.description || null,
        conMedio ? aMedioNuevo(m.payment_method) : 'cash',
        fecha,
        fecha,
      );
    }
  });
  tx(filas);
  console.log(`  expenses: ${filas.length} registros rescatados de cash_movements (todos como Negocio)`);
}

copiar('settings');

nueva.pragma('foreign_keys = ON');

// ---------- 4. Resultado ----------
console.log('\nResultado en la base nueva:');
for (const t of ['products', 'customers', 'suppliers', 'sales', 'sale_items', 'sale_payments', 'expenses', 'settings']) {
  if (existe(nueva, t)) console.log(`  ${t}: ${contar(nueva, t)}`);
}

const totalVentas = existe(nueva, 'sales')
  ? nueva.prepare("SELECT COALESCE(SUM(total),0) t FROM sales WHERE status='completed'").get().t
  : 0;
console.log(`\nTotal facturado importado: $${totalVentas.toLocaleString('es-AR')}`);

vieja.close();
nueva.close();
console.log('\n✔ Listo. Abrí la app y revisá Historial de Ventas.');
console.log('  Si algo salió mal, restaurá con:');
console.log(`  Copy-Item "${backup}" "${rutaNueva}" -Force\n`);

if (process.versions.electron) require('electron').app.quit();
