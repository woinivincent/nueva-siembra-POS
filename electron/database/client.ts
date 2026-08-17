// electron/database/client.ts
import Database from "better-sqlite3";
import path from "path";
import { app } from "electron";
import fs from "fs";

const userDataPath = app.getPath("userData");
const dbPath = path.join(userDataPath, "pos-database.db");

if (!fs.existsSync(userDataPath)) {
  fs.mkdirSync(userDataPath, { recursive: true });
}

export const sqlite = new Database(dbPath);
sqlite.pragma("foreign_keys = ON");

export function initializeDatabase() {
  console.log("📦 Inicializando base de datos en:", dbPath);
  createTables();
  runMigrations(); // Nueva función
  seedInitialData();
  console.log("✅ Base de datos lista");
}

function runMigrations() {
  try {
    // Migración: precios por pack. Reemplazan al precio diferenciado por
    // medio de pago (price_card), que ya no se usa porque el precio no
    // depende de si se paga en efectivo o por transferencia.
    const productsInfo = sqlite
      .prepare("PRAGMA table_info(products)")
      .all() as any[];
    const productColumns = new Set(productsInfo.map((col: any) => col.name));

    for (const size of [3, 4, 5, 10]) {
      const column = `price_pack_${size}`;
      if (!productColumns.has(column)) {
        console.log(`📦 Ejecutando migración: agregar ${column}...`);
        sqlite.exec(`ALTER TABLE products ADD COLUMN ${column} REAL`);
      }
    }

    // Los accesos rápidos del POS se eliminaron: los productos ya no se
    // marcan como favoritos ni tienen tecla asignada.
    for (const column of ["is_favorite", "favorite_key"]) {
      if (productColumns.has(column)) {
        console.log(`📦 Ejecutando migración: eliminar ${column}...`);
        sqlite.exec(`ALTER TABLE products DROP COLUMN ${column}`);
      }
    }

    if (productColumns.has("price_card")) {
      console.log("📦 Ejecutando migración: eliminar price_card...");
      sqlite.exec(`ALTER TABLE products DROP COLUMN price_card`);
      console.log("✅ Migración completada");
    }

    // Migración: baja de la caja diaria y de la caja reserva.
    //
    // Ya no hay local ni apertura/cierre de caja, así que los egresos dejan de
    // vivir dentro de cash_movements y pasan a su propia tabla. Antes de
    // borrar nada, se rescatan los egresos ya cargados: quedan como gastos de
    // negocio, que es lo que eran hasta ahora.
    const tableExists = (name: string) =>
      !!sqlite
        .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")
        .get(name);

    if (tableExists("cash_movements")) {
      console.log("📦 Ejecutando migración: mover egresos de caja a la tabla expenses...");

      const movementColumns = new Set(
        (sqlite.prepare("PRAGMA table_info(cash_movements)").all() as any[]).map(
          (col: any) => col.name,
        ),
      );
      // payment_method sólo existe en bases que llegaron a tener esa versión
      const method = movementColumns.has("payment_method")
        ? "CASE WHEN payment_method = 'transfer' THEN 'transfer' ELSE 'cash' END"
        : "'cash'";

      sqlite.exec(`
        INSERT INTO expenses (type, amount, concept, description, payment_method, date, created_at)
        SELECT 'business', amount, concept, description, ${method},
               COALESCE(created_at, strftime('%s', 'now')),
               COALESCE(created_at, strftime('%s', 'now'))
        FROM cash_movements
        WHERE type = 'expense';
      `);

      const moved = sqlite
        .prepare("SELECT COUNT(*) as count FROM expenses")
        .get() as { count: number };
      console.log(`✅ ${moved.count} egresos conservados`);
    }

    // Las ventas ya no pertenecen a una caja, y el medio de pago queda
    // reducido a efectivo o transferencia. Las ventas viejas con débito,
    // crédito o pago mixto se registran como transferencia, que es el medio
    // no-efectivo que sigue existiendo.
    const salesColumns = new Set(
      (sqlite.prepare("PRAGMA table_info(sales)").all() as any[]).map((col: any) => col.name),
    );

    if (salesColumns.has("cash_register_id")) {
      console.log("📦 Ejecutando migración: desacoplar ventas de la caja...");

      sqlite.exec("PRAGMA foreign_keys = OFF;");
      const migrateSales = sqlite.transaction(() => {
        sqlite.exec(`
          CREATE TABLE sales_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_id INTEGER REFERENCES customers(id),
            subtotal REAL NOT NULL,
            tax REAL DEFAULT 0,
            discount REAL DEFAULT 0,
            total REAL NOT NULL,
            payment_method TEXT NOT NULL CHECK(payment_method IN ('cash', 'transfer')),
            status TEXT DEFAULT 'completed' CHECK(status IN ('completed', 'suspended', 'cancelled')),
            created_at INTEGER DEFAULT (strftime('%s', 'now')),
            user_id INTEGER
          );
        `);

        sqlite.exec(`
          INSERT INTO sales_new (id, customer_id, subtotal, tax, discount, total, payment_method, status, created_at, user_id)
          SELECT id, customer_id, subtotal, tax, discount, total,
                 CASE WHEN payment_method = 'cash' THEN 'cash' ELSE 'transfer' END,
                 status, created_at, user_id
          FROM sales;
        `);

        sqlite.exec("DROP TABLE sales;");
        sqlite.exec("ALTER TABLE sales_new RENAME TO sales;");
        sqlite.exec("CREATE INDEX IF NOT EXISTS sales_customer_idx ON sales(customer_id);");
        sqlite.exec("CREATE INDEX IF NOT EXISTS sales_date_idx ON sales(created_at);");
        sqlite.exec("CREATE INDEX IF NOT EXISTS sales_status_idx ON sales(status);");

        if (tableExists("sale_payments")) {
          sqlite.exec(`
            UPDATE sale_payments
            SET payment_method = CASE WHEN payment_method = 'cash' THEN 'cash' ELSE 'transfer' END;
          `);
        }
      });

      try {
        migrateSales();
        console.log("✅ Migración completada");
      } finally {
        sqlite.exec("PRAGMA foreign_keys = ON;");
      }
    }

    // Recién ahora, con los datos ya rescatados, se pueden borrar las tablas.
    for (const table of ["cash_movements", "cash_registers", "reserve_fund"]) {
      if (tableExists(table)) {
        console.log(`📦 Ejecutando migración: eliminar tabla ${table}...`);
        sqlite.exec(`DROP TABLE ${table}`);
      }
    }

  } catch (error) {
    console.error("Error en migraciones:", error);
  }
}

function createTables() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      barcode TEXT UNIQUE,
      category TEXT NOT NULL,
      price REAL NOT NULL,
      price_pack_3 REAL,
      price_pack_4 REAL,
      price_pack_5 REAL,
      price_pack_10 REAL,
      cost REAL DEFAULT 0,
      stock REAL DEFAULT 0 NOT NULL,
      stock_min REAL DEFAULT 0,
      unit TEXT DEFAULT 'ud' NOT NULL CHECK(unit IN ('ud', 'kg')),
      image TEXT,
      is_active INTEGER DEFAULT 1,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now'))
    );

    CREATE INDEX IF NOT EXISTS products_barcode_idx ON products(barcode);
    CREATE INDEX IF NOT EXISTS products_category_idx ON products(category);
    CREATE INDEX IF NOT EXISTS products_name_idx ON products(name);

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      birth_date TEXT,
      occupation TEXT,
      is_active INTEGER DEFAULT 1,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now'))
    );

    CREATE INDEX IF NOT EXISTS customers_phone_idx ON customers(phone);
    CREATE INDEX IF NOT EXISTS customers_email_idx ON customers(email);

    CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_name TEXT NOT NULL,
      contact_name TEXT,
      phone TEXT,
      email TEXT,
      category TEXT,
      is_active INTEGER DEFAULT 1,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now'))
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL CHECK(type IN ('business', 'salary')),
      amount REAL NOT NULL,
      concept TEXT NOT NULL,
      description TEXT,
      payment_method TEXT NOT NULL DEFAULT 'cash' CHECK(payment_method IN ('cash', 'transfer')),
      date INTEGER NOT NULL,
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    );

    CREATE INDEX IF NOT EXISTS expenses_type_idx ON expenses(type);
    CREATE INDEX IF NOT EXISTS expenses_date_idx ON expenses(date);

    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER REFERENCES customers(id),
      subtotal REAL NOT NULL,
      tax REAL DEFAULT 0,
      discount REAL DEFAULT 0,
      total REAL NOT NULL,
      payment_method TEXT NOT NULL CHECK(payment_method IN ('cash', 'debit', 'credit', 'transfer', 'mixed')),
      status TEXT DEFAULT 'completed' CHECK(status IN ('completed', 'suspended', 'cancelled')),
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      user_id INTEGER
    );

    CREATE INDEX IF NOT EXISTS sales_customer_idx ON sales(customer_id);
    CREATE INDEX IF NOT EXISTS sales_date_idx ON sales(created_at);
    CREATE INDEX IF NOT EXISTS sales_status_idx ON sales(status);
    
    
 CREATE TABLE IF NOT EXISTS sale_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER NOT NULL REFERENCES sales(id),
      payment_method TEXT NOT NULL CHECK(payment_method IN ('cash', 'debit', 'credit', 'transfer')),
      amount REAL NOT NULL,
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    );
    CREATE INDEX IF NOT EXISTS sale_payments_sale_idx ON sale_payments(sale_id);
    CREATE INDEX IF NOT EXISTS sale_payments_method_idx ON sale_payments(payment_method);
    
    CREATE TABLE IF NOT EXISTS sale_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER NOT NULL REFERENCES sales(id),
      product_id INTEGER NOT NULL REFERENCES products(id),
      quantity REAL NOT NULL,
      price REAL NOT NULL,
      discount REAL DEFAULT 0,
      subtotal REAL NOT NULL
    );

    CREATE INDEX IF NOT EXISTS sale_items_sale_idx ON sale_items(sale_id);
    CREATE INDEX IF NOT EXISTS sale_items_product_idx ON sale_items(product_id);

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at INTEGER DEFAULT (strftime('%s', 'now'))
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT DEFAULT 'cashier' CHECK(role IN ('admin', 'cashier')),
      is_active INTEGER DEFAULT 1,
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    );
  `);
}

function seedInitialData() {
  try {
    const existingCount = sqlite
      .prepare("SELECT COUNT(*) as count FROM products")
      .get() as { count: number };

    if (existingCount.count > 0) {
      console.log(
        `ℹ️ Ya existen ${existingCount.count} productos, saltando seed`,
      );
      return;
    }

    console.log("🌱 Insertando productos de ejemplo...");

    const insertProduct = sqlite.prepare(`
      INSERT INTO products (name, category, price, price_pack_3, price_pack_4, price_pack_5, price_pack_10, cost, stock, stock_min, unit, barcode)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // [nombre, categoria, precioUnidad, packX3, packX4, packX5, packX10, costo, stock, stockMin, unidad, barcode]
    //
    // Viandas y tartas se venden por unidad y en packs de 3, 5 y 10.
    // Las hamburguesas tienen su propia lógica: únicamente pack x4.
    // Un precio de pack en null significa que ese producto no se vende en
    // ese pack; si están los cuatro en null, el producto es sólo por unidad.
    const products = [
      // Viandas
      ["Vianda de milanesa", "Viandas", 3000, 2800, null, 2700, 2500, 1500, 20, 5, "ud", null],
      ["Vianda de pollo", "Viandas", 3000, 2800, null, 2700, 2500, 1500, 20, 5, "ud", null],
      ["Vianda de carne", "Viandas", 3000, 2800, null, 2700, 2500, 1600, 15, 5, "ud", null],
      ["Vianda vegetariana", "Viandas", 3000, 2800, null, 2700, 2500, 1400, 15, 5, "ud", null],

      // Tartas
      ["Tarta de verdura", "Tartas", 3000, 2800, null, 2700, 2500, 1500, 12, 4, "ud", null],
      ["Tarta de jamón y queso", "Tartas", 3000, 2800, null, 2700, 2500, 1600, 12, 4, "ud", null],
      // Precio propio, pero participa de los packs con su valor diferenciado
      ["Tarta de champignones", "Tartas", 3500, 3300, null, 3200, 3000, 1900, 8, 3, "ud", null],
      // Se vende únicamente por unidad: sin precios de pack cargados
      ["Tarta de salmón", "Tartas", 4500, null, null, null, null, 2600, 6, 2, "ud", null],

      // Hamburguesas: sólo pack x4
      ["Hamburguesa clásica", "Hamburguesas", 6000, null, 5600, null, null, 3000, 20, 5, "ud", null],
      ["Hamburguesa doble", "Hamburguesas", 6000, null, 5600, null, null, 3300, 15, 5, "ud", null],
    ];

    const insertMany = sqlite.transaction((items: any[][]) => {
      for (const p of items) {
        insertProduct.run(...p);
        console.log(`✓ Producto: ${p[0]}`);
      }
    });

    insertMany(products);

    const insertSetting = sqlite.prepare(
      "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
    );
    insertSetting.run("tax_rate", "0");
    insertSetting.run("currency", "ARS");
    insertSetting.run("theme", "light");
    insertSetting.run("business_name", "Nueva Siembra");

    const count = sqlite
      .prepare("SELECT COUNT(*) as count FROM products")
      .get() as { count: number };
    console.log(`✅ Total productos en BD: ${count.count}`);
  } catch (error) {
    console.error("Error in seedInitialData:", error);
  }
}
