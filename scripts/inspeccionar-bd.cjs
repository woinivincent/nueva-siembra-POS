/*
 * Inspecciona una o varias bases SQLite y muestra su estructura y cuántos
 * registros tiene cada tabla. No modifica nada: abre en modo lectura.
 *
 * Uso (desde la raíz del proyecto):
 *   npx electron scripts/inspeccionar-bd.cjs "C:\ruta\vieja.db" "C:\ruta\nueva.db"
 *
 * Se corre con electron y no con node porque better-sqlite3 viene compilado
 * para electron.
 */
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const rutas = process.argv.slice(2).filter((a) => !a.startsWith('-') && a.endsWith('.db'));

if (rutas.length === 0) {
  console.log('Pasá la ruta de al menos una base .db');
  process.exit(1);
}

for (const ruta of rutas) {
  console.log('\n' + '='.repeat(70));
  console.log('BASE:', ruta);

  if (!fs.existsSync(ruta)) {
    console.log('  >> no existe');
    continue;
  }
  console.log('  tamaño:', (fs.statSync(ruta).size / 1024).toFixed(1), 'KB');
  console.log('='.repeat(70));

  let db;
  try {
    db = new Database(ruta, { readonly: true, fileMustExist: true });
  } catch (e) {
    console.log('  >> no se pudo abrir:', e.message);
    continue;
  }

  const tablas = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
    .all()
    .map((r) => r.name);

  for (const tabla of tablas) {
    let filas = '?';
    try {
      filas = db.prepare(`SELECT COUNT(*) AS n FROM "${tabla}"`).get().n;
    } catch (e) {
      filas = 'error';
    }
    const cols = db
      .prepare(`PRAGMA table_info("${tabla}")`)
      .all()
      .map((c) => `${c.name}:${c.type || '?'}`);

    console.log(`\n${tabla}  (${filas} registros)`);
    console.log('  ' + cols.join(', '));

    // Una fila de muestra ayuda a entender el contenido sin exponer todo
    if (typeof filas === 'number' && filas > 0) {
      const muestra = db.prepare(`SELECT * FROM "${tabla}" LIMIT 1`).get();
      console.log('  ejemplo:', JSON.stringify(muestra).slice(0, 300));
    }
  }

  db.close();
}

console.log('\nListo.');
if (process.versions.electron) require('electron').app.quit();
