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
    // Migración: agregar payment_method a cash_movements
    const movementsInfo = sqlite
      .prepare("PRAGMA table_info(cash_movements)")
      .all() as any[];
    const hasPaymentMethod = movementsInfo.some((col: any) => col.name === "payment_method");
    if (!hasPaymentMethod) {
      console.log("📦 Ejecutando migración: agregar payment_method a cash_movements...");
      sqlite.exec(`ALTER TABLE cash_movements ADD COLUMN payment_method TEXT DEFAULT 'cash'`);
      console.log("✅ Migración completada");
    }

    // Verificar si la columna price_card ya existe
    const tableInfo = sqlite
      .prepare("PRAGMA table_info(products)")
      .all() as any[];
    const hasColumn = tableInfo.some((col: any) => col.name === "price_card");

    if (!hasColumn) {
      console.log("📦 Ejecutando migración: agregar price_card...");
      sqlite.exec(`ALTER TABLE products ADD COLUMN price_card REAL`);
      sqlite.exec(
        `UPDATE products SET price_card = price WHERE price_card IS NULL`,
      );
      console.log("✅ Migración completada");
    }

    // Permitir payment_method = 'mixed' en sales (pago dividido)
    const salesSqlRow = sqlite
      .prepare(
        "SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'sales'",
      )
      .get() as { sql?: string } | undefined;

    const salesSql = (salesSqlRow?.sql || "").toLowerCase();
    const salesAllowsMixed = salesSql.includes("mixed");

    if (!salesAllowsMixed) {
      console.log("📦 Ejecutando migración: permitir pago 'mixed' en sales...");

      // SQLite no permite alterar CHECK constraints directamente.
      // Re-creamos la tabla manteniendo los datos.
      sqlite.exec("PRAGMA foreign_keys = OFF;");
      const migrateSales = sqlite.transaction(() => {
        sqlite.exec(`
          CREATE TABLE IF NOT EXISTS sales_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_id INTEGER REFERENCES customers(id),
            cash_register_id INTEGER REFERENCES cash_registers(id),
            subtotal REAL NOT NULL,
            tax REAL DEFAULT 0,
            discount REAL DEFAULT 0,
            total REAL NOT NULL,
            payment_method TEXT NOT NULL CHECK(payment_method IN ('cash', 'debit', 'credit', 'transfer', 'mixed')),
            status TEXT DEFAULT 'completed' CHECK(status IN ('completed', 'suspended', 'cancelled')),
            created_at INTEGER DEFAULT (strftime('%s', 'now')),
            user_id INTEGER
          );
        `);

        // Copiar datos (preservando ids)
        sqlite.exec(`
          INSERT INTO sales_new (id, customer_id, cash_register_id, subtotal, tax, discount, total, payment_method, status, created_at, user_id)
          SELECT id, customer_id, cash_register_id, subtotal, tax, discount, total, payment_method, status, created_at, user_id
          FROM sales;
        `);

        sqlite.exec("DROP TABLE sales;");
        sqlite.exec("ALTER TABLE sales_new RENAME TO sales;");

        // Re-crear índices
        sqlite.exec("CREATE INDEX IF NOT EXISTS sales_customer_idx ON sales(customer_id);");
        sqlite.exec("CREATE INDEX IF NOT EXISTS sales_date_idx ON sales(created_at);");
        sqlite.exec("CREATE INDEX IF NOT EXISTS sales_status_idx ON sales(status);");
      });

      try {
        migrateSales();
        console.log("✅ Migración completada");
      } finally {
        sqlite.exec("PRAGMA foreign_keys = ON;");
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
      price_card REAL,
      cost REAL DEFAULT 0,
      stock REAL DEFAULT 0 NOT NULL,
      stock_min REAL DEFAULT 0,
      unit TEXT DEFAULT 'ud' NOT NULL CHECK(unit IN ('ud', 'kg')),
      image TEXT,
      is_active INTEGER DEFAULT 1,
      is_favorite INTEGER DEFAULT 0,
      favorite_key TEXT,
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

    CREATE TABLE IF NOT EXISTS cash_registers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      opened_at INTEGER NOT NULL,
      closed_at INTEGER,
      opening_amount REAL NOT NULL,
      closing_amount REAL,
      expected_amount REAL,
      difference REAL,
      status TEXT DEFAULT 'open' NOT NULL CHECK(status IN ('open', 'closed')),
      user_id INTEGER,
      notes TEXT
    );

    CREATE INDEX IF NOT EXISTS cash_registers_status_idx ON cash_registers(status);
    CREATE INDEX IF NOT EXISTS cash_registers_date_idx ON cash_registers(opened_at);

    CREATE TABLE IF NOT EXISTS cash_movements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cash_register_id INTEGER NOT NULL REFERENCES cash_registers(id),
      type TEXT NOT NULL CHECK(type IN ('income', 'expense', 'sale')),
      amount REAL NOT NULL,
      concept TEXT NOT NULL,
      description TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    );

    CREATE INDEX IF NOT EXISTS cash_movements_register_idx ON cash_movements(cash_register_id);
    CREATE INDEX IF NOT EXISTS cash_movements_type_idx ON cash_movements(type);
CREATE TABLE IF NOT EXISTS reserve_fund (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
      amount REAL NOT NULL,
      concept TEXT NOT NULL,
      category TEXT,
      description TEXT,
      source_cash_register_id INTEGER REFERENCES cash_registers(id),
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    );

    CREATE INDEX IF NOT EXISTS reserve_fund_type_idx ON reserve_fund(type);
    CREATE INDEX IF NOT EXISTS reserve_fund_date_idx ON reserve_fund(created_at);
    CREATE INDEX IF NOT EXISTS reserve_fund_category_idx ON reserve_fund(category);
    
    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER REFERENCES customers(id),
      cash_register_id INTEGER REFERENCES cash_registers(id),
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

    // Ahora con price y price_card
    const insertProduct = sqlite.prepare(`
      INSERT INTO products (name, category, price, price_card, cost, stock, stock_min, unit, barcode, is_favorite, favorite_key)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // [nombre, categoria, precioEfectivo, precioTarjeta, costo, stock, stockMin, unidad, barcode, favorito, tecla]
    const products = [
      [
        "Ensalada César",
        "Ensaladas",
        8.5,
        9.35,
        4.0,
        15,
        5,
        "ud",
        "7501234567890",
        1,
        "F1",
      ],
      [
        "Bowl de Quinoa",
        "Bowls",
        9.0,
        9.9,
        4.5,
        12,
        5,
        "ud",
        "7501234567891",
        1,
        "F2",
      ],
      [
        "Smoothie Verde",
        "Bebidas",
        5.5,
        6.05,
        2.5,
        20,
        5,
        "ud",
        "7501234567892",
        1,
        "F3",
      ],
      [
        "Wrap de Pollo",
        "Wraps",
        7.5,
        8.25,
        3.5,
        10,
        5,
        "ud",
        "7501234567893",
        1,
        "F4",
      ],
      [
        "Jugo Detox",
        "Bebidas",
        6.0,
        6.6,
        2.8,
        18,
        5,
        "ud",
        "7501234567894",
        1,
        "F5",
      ],
      [
        "Bowl Acai",
        "Bowls",
        10.0,
        11.0,
        5.0,
        8,
        3,
        "ud",
        "7501234567895",
        1,
        "F6",
      ],
      [
        "Ensalada Mediterránea",
        "Ensaladas",
        8.0,
        8.8,
        4.0,
        10,
        5,
        "ud",
        "7501234567896",
        0,
        null,
      ],
      [
        "Agua Mineral",
        "Bebidas",
        2.5,
        2.75,
        1.0,
        50,
        10,
        "ud",
        "7501234567897",
        0,
        null,
      ],
      [
        "Ensalada Griega",
        "Ensaladas",
        7.5,
        8.25,
        3.5,
        12,
        5,
        "ud",
        "7501234567898",
        0,
        null,
      ],
      [
        "Bowl Proteico",
        "Bowls",
        11.0,
        12.1,
        5.5,
        10,
        3,
        "ud",
        "7501234567899",
        0,
        null,
      ],
      [
        "Té Verde",
        "Bebidas",
        3.0,
        3.3,
        1.2,
        30,
        10,
        "ud",
        "7501234567900",
        0,
        null,
      ],
      [
        "Wrap Vegetariano",
        "Wraps",
        6.5,
        7.15,
        3.0,
        15,
        5,
        "ud",
        "7501234567901",
        0,
        null,
      ],
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
    insertSetting.run("business_name", "Healthy Food POS");
    insertSetting.run("card_surcharge", "10"); // Recargo por defecto del 10%

    const count = sqlite
      .prepare("SELECT COUNT(*) as count FROM products")
      .get() as { count: number };
    console.log(`✅ Total productos en BD: ${count.count}`);
  } catch (error) {
    console.error("Error in seedInitialData:", error);
  }
}
