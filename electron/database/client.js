// src/main/database/client.ts
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import path from 'path';
import { app } from 'electron';
import fs from 'fs';
// Obtener ruta para guardar la DB
const userDataPath = app.getPath('userData');
const dbPath = path.join(userDataPath, 'pos-database.db');
// Asegurar que la carpeta exista
if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true });
}
// Crear conexión SQLite
const sqlite = new Database(dbPath);
// Habilitar foreign keys
sqlite.pragma('foreign_keys = ON');
// Crear instancia de Drizzle
export const db = drizzle(sqlite, { schema });
// Función para inicializar la base de datos
export function initializeDatabase() {
    console.log('📦 Inicializando base de datos en:', dbPath);
    // Crear tablas si no existen
    createTables();
    // Insertar datos iniciales si la DB está vacía
    seedInitialData();
    console.log('✅ Base de datos lista');
}
function createTables() {
    // Las tablas se crean automáticamente con Drizzle migrations
    // Por ahora, ejecutamos SQL directo para desarrollo rápido
    sqlite.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      barcode TEXT UNIQUE,
      category TEXT NOT NULL,
      price REAL NOT NULL,
      cost REAL DEFAULT 0,
      stock REAL DEFAULT 0 NOT NULL,
      stock_min REAL DEFAULT 0,
      unit TEXT DEFAULT 'ud' NOT NULL CHECK(unit IN ('ud', 'kg')),
      image TEXT,
      is_active INTEGER DEFAULT 1,
      is_favorite INTEGER DEFAULT 0,
      favorite_key TEXT,
      created_at INTEGER DEFAULT (unixepoch()),
      updated_at INTEGER DEFAULT (unixepoch())
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
      created_at INTEGER DEFAULT (unixepoch()),
      updated_at INTEGER DEFAULT (unixepoch())
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
      created_at INTEGER DEFAULT (unixepoch()),
      updated_at INTEGER DEFAULT (unixepoch())
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
      created_at INTEGER DEFAULT (unixepoch())
    );

    CREATE INDEX IF NOT EXISTS cash_movements_register_idx ON cash_movements(cash_register_id);
    CREATE INDEX IF NOT EXISTS cash_movements_type_idx ON cash_movements(type);

    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER REFERENCES customers(id),
      cash_register_id INTEGER REFERENCES cash_registers(id),
      subtotal REAL NOT NULL,
      tax REAL DEFAULT 0,
      discount REAL DEFAULT 0,
      total REAL NOT NULL,
      payment_method TEXT NOT NULL CHECK(payment_method IN ('cash', 'debit', 'credit', 'transfer')),
      status TEXT DEFAULT 'completed' CHECK(status IN ('completed', 'suspended', 'cancelled')),
      created_at INTEGER DEFAULT (unixepoch()),
      user_id INTEGER
    );

    CREATE INDEX IF NOT EXISTS sales_customer_idx ON sales(customer_id);
    CREATE INDEX IF NOT EXISTS sales_date_idx ON sales(created_at);
    CREATE INDEX IF NOT EXISTS sales_status_idx ON sales(status);

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
      updated_at INTEGER DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT DEFAULT 'cashier' CHECK(role IN ('admin', 'cashier')),
      is_active INTEGER DEFAULT 1,
      created_at INTEGER DEFAULT (unixepoch())
    );
  `);
}
function seedInitialData() {
    // Verificar si ya hay datos
    const productCount = sqlite.prepare('SELECT COUNT(*) as count FROM products').get();
    if (productCount.count === 0) {
        console.log('🌱 Insertando datos de ejemplo...');
        // Productos de ejemplo
        const insertProduct = sqlite.prepare(`
      INSERT INTO products (name, category, price, cost, stock, stock_min, unit, barcode, is_favorite, favorite_key)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
        const products = [
            ['Ensalada César', 'Ensaladas', 8.50, 4.00, 15, 5, 'ud', '7501234567890', 1, 'F1'],
            ['Bowl de Quinoa', 'Bowls', 9.00, 4.50, 12, 5, 'ud', '7501234567891', 1, 'F2'],
            ['Smoothie Verde', 'Bebidas', 5.50, 2.50, 20, 5, 'ud', '7501234567892', 1, 'F3'],
            ['Wrap de Pollo', 'Wraps', 7.50, 3.50, 10, 5, 'ud', '7501234567893', 1, 'F4'],
            ['Jugo Detox', 'Bebidas', 6.00, 2.80, 18, 5, 'ud', '7501234567894', 1, 'F5'],
            ['Bowl Acai', 'Bowls', 10.00, 5.00, 8, 3, 'ud', '7501234567895', 1, 'F6'],
            ['Ensalada Mediterránea', 'Ensaladas', 8.00, 4.00, 10, 5, 'ud', '7501234567896', 0, null],
            ['Agua Mineral', 'Bebidas', 2.50, 1.00, 50, 10, 'ud', '7501234567897', 0, null],
            ['Proteína en Polvo', 'Suplementos', 3.00, 1.50, 25, 5, 'kg', '7501234567898', 0, null],
        ];
        products.forEach(p => insertProduct.run(...p));
        // Configuración inicial
        const insertSetting = sqlite.prepare('INSERT INTO settings (key, value) VALUES (?, ?)');
        insertSetting.run('tax_rate', '0.16'); // IVA 16%
        insertSetting.run('currency', 'MXN');
        insertSetting.run('theme', 'dark');
        insertSetting.run('business_name', 'Healthy Food POS');
        console.log('✅ Datos de ejemplo insertados');
    }
}
export { sqlite };
