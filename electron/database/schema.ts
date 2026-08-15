// electron/database/schema.ts
import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const products = sqliteTable('products', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  description: text('description'),
  barcode: text('barcode').unique(),
  category: text('category').notNull(),
  price: real('price').notNull(),
  // Precios de pack, cargados a mano. NULL = el producto no se vende en ese pack.
  pricePack3: real('price_pack_3'),
  pricePack4: real('price_pack_4'),
  pricePack5: real('price_pack_5'),
  pricePack10: real('price_pack_10'),
  cost: real('cost').default(0),
  stock: real('stock').default(0).notNull(),
  stockMin: real('stock_min').default(0),
  unit: text('unit', { enum: ['ud', 'kg'] }).default('ud').notNull(),
  image: text('image'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  isFavorite: integer('is_favorite', { mode: 'boolean' }).default(false),
  favoriteKey: text('favorite_key'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
}, (table) => ({
  barcodeIdx: index('products_barcode_idx').on(table.barcode),
  categoryIdx: index('products_category_idx').on(table.category),
  nameIdx: index('products_name_idx').on(table.name),
}));

export const customers = sqliteTable('customers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  phone: text('phone'),
  email: text('email'),
  birthDate: text('birth_date'),
  occupation: text('occupation'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
}, (table) => ({
  phoneIdx: index('customers_phone_idx').on(table.phone),
  emailIdx: index('customers_email_idx').on(table.email),
}));

export const suppliers = sqliteTable('suppliers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  companyName: text('company_name').notNull(),
  contactName: text('contact_name'),
  phone: text('phone'),
  email: text('email'),
  category: text('category'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

export const sales = sqliteTable('sales', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  customerId: integer('customer_id').references(() => customers.id),
  subtotal: real('subtotal').notNull(),
  tax: real('tax').default(0),
  discount: real('discount').default(0),
  total: real('total').notNull(),
  paymentMethod: text('payment_method', {
    enum: ['cash', 'transfer']
  }).notNull(),
  status: text('status', { 
    enum: ['completed', 'suspended', 'cancelled'] 
  }).default('completed'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
  userId: integer('user_id'),
}, (table) => ({
  customerIdx: index('sales_customer_idx').on(table.customerId),
  dateIdx: index('sales_date_idx').on(table.createdAt),
  statusIdx: index('sales_status_idx').on(table.status),
}));

export const saleItems = sqliteTable('sale_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  saleId: integer('sale_id').notNull().references(() => sales.id),
  productId: integer('product_id').notNull().references(() => products.id),
  quantity: real('quantity').notNull(),
  price: real('price').notNull(),
  discount: real('discount').default(0),
  subtotal: real('subtotal').notNull(),
}, (table) => ({
  saleIdx: index('sale_items_sale_idx').on(table.saleId),
  productIdx: index('sale_items_product_idx').on(table.productId),
}));

export const expenses = sqliteTable('expenses', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  // 'business' = gasto del negocio, 'salary' = sueldo
  type: text('type', { enum: ['business', 'salary'] }).notNull(),
  amount: real('amount').notNull(),
  concept: text('concept').notNull(),
  description: text('description'),
  paymentMethod: text('payment_method', { enum: ['cash', 'transfer'] }).default('cash').notNull(),
  date: integer('date', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
}, (table) => ({
  typeIdx: index('expenses_type_idx').on(table.type),
  dateIdx: index('expenses_date_idx').on(table.date),
}));

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  fullName: text('full_name').notNull(),
  role: text('role', { enum: ['admin', 'cashier'] }).default('cashier'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
});
export const salePayments = sqliteTable('sale_payments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  saleId: integer('sale_id').notNull().references(() => sales.id),
  paymentMethod: text('payment_method', {
    enum: ['cash', 'transfer']
  }).notNull(),
  amount: real('amount').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(unixepoch())`),
}, (table) => ({
  saleIdx: index('sale_payments_sale_idx').on(table.saleId),
  methodIdx: index('sale_payments_method_idx').on(table.paymentMethod),
}));