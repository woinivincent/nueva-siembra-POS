"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.salePayments = exports.users = exports.settings = exports.saleItems = exports.sales = exports.cashMovements = exports.cashRegisters = exports.suppliers = exports.customers = exports.products = void 0;
// electron/database/schema.ts
const sqlite_core_1 = require("drizzle-orm/sqlite-core");
const drizzle_orm_1 = require("drizzle-orm");
exports.products = (0, sqlite_core_1.sqliteTable)('products', {
    id: (0, sqlite_core_1.integer)('id').primaryKey({ autoIncrement: true }),
    name: (0, sqlite_core_1.text)('name').notNull(),
    description: (0, sqlite_core_1.text)('description'),
    barcode: (0, sqlite_core_1.text)('barcode').unique(),
    category: (0, sqlite_core_1.text)('category').notNull(),
    price: (0, sqlite_core_1.real)('price').notNull(),
    cost: (0, sqlite_core_1.real)('cost').default(0),
    stock: (0, sqlite_core_1.real)('stock').default(0).notNull(),
    stockMin: (0, sqlite_core_1.real)('stock_min').default(0),
    unit: (0, sqlite_core_1.text)('unit', { enum: ['ud', 'kg'] }).default('ud').notNull(),
    image: (0, sqlite_core_1.text)('image'),
    isActive: (0, sqlite_core_1.integer)('is_active', { mode: 'boolean' }).default(true),
    isFavorite: (0, sqlite_core_1.integer)('is_favorite', { mode: 'boolean' }).default(false),
    favoriteKey: (0, sqlite_core_1.text)('favorite_key'),
    createdAt: (0, sqlite_core_1.integer)('created_at', { mode: 'timestamp' }).default((0, drizzle_orm_1.sql) `(unixepoch())`),
    updatedAt: (0, sqlite_core_1.integer)('updated_at', { mode: 'timestamp' }).default((0, drizzle_orm_1.sql) `(unixepoch())`),
}, (table) => ({
    barcodeIdx: (0, sqlite_core_1.index)('products_barcode_idx').on(table.barcode),
    categoryIdx: (0, sqlite_core_1.index)('products_category_idx').on(table.category),
    nameIdx: (0, sqlite_core_1.index)('products_name_idx').on(table.name),
}));
exports.customers = (0, sqlite_core_1.sqliteTable)('customers', {
    id: (0, sqlite_core_1.integer)('id').primaryKey({ autoIncrement: true }),
    firstName: (0, sqlite_core_1.text)('first_name').notNull(),
    lastName: (0, sqlite_core_1.text)('last_name').notNull(),
    phone: (0, sqlite_core_1.text)('phone'),
    email: (0, sqlite_core_1.text)('email'),
    birthDate: (0, sqlite_core_1.text)('birth_date'),
    occupation: (0, sqlite_core_1.text)('occupation'),
    isActive: (0, sqlite_core_1.integer)('is_active', { mode: 'boolean' }).default(true),
    createdAt: (0, sqlite_core_1.integer)('created_at', { mode: 'timestamp' }).default((0, drizzle_orm_1.sql) `(unixepoch())`),
    updatedAt: (0, sqlite_core_1.integer)('updated_at', { mode: 'timestamp' }).default((0, drizzle_orm_1.sql) `(unixepoch())`),
}, (table) => ({
    phoneIdx: (0, sqlite_core_1.index)('customers_phone_idx').on(table.phone),
    emailIdx: (0, sqlite_core_1.index)('customers_email_idx').on(table.email),
}));
exports.suppliers = (0, sqlite_core_1.sqliteTable)('suppliers', {
    id: (0, sqlite_core_1.integer)('id').primaryKey({ autoIncrement: true }),
    companyName: (0, sqlite_core_1.text)('company_name').notNull(),
    contactName: (0, sqlite_core_1.text)('contact_name'),
    phone: (0, sqlite_core_1.text)('phone'),
    email: (0, sqlite_core_1.text)('email'),
    category: (0, sqlite_core_1.text)('category'),
    isActive: (0, sqlite_core_1.integer)('is_active', { mode: 'boolean' }).default(true),
    createdAt: (0, sqlite_core_1.integer)('created_at', { mode: 'timestamp' }).default((0, drizzle_orm_1.sql) `(unixepoch())`),
    updatedAt: (0, sqlite_core_1.integer)('updated_at', { mode: 'timestamp' }).default((0, drizzle_orm_1.sql) `(unixepoch())`),
});
exports.cashRegisters = (0, sqlite_core_1.sqliteTable)('cash_registers', {
    id: (0, sqlite_core_1.integer)('id').primaryKey({ autoIncrement: true }),
    openedAt: (0, sqlite_core_1.integer)('opened_at', { mode: 'timestamp' }).notNull(),
    closedAt: (0, sqlite_core_1.integer)('closed_at', { mode: 'timestamp' }),
    openingAmount: (0, sqlite_core_1.real)('opening_amount').notNull(),
    closingAmount: (0, sqlite_core_1.real)('closing_amount'),
    expectedAmount: (0, sqlite_core_1.real)('expected_amount'),
    difference: (0, sqlite_core_1.real)('difference'),
    status: (0, sqlite_core_1.text)('status', { enum: ['open', 'closed'] }).default('open').notNull(),
    userId: (0, sqlite_core_1.integer)('user_id'),
    notes: (0, sqlite_core_1.text)('notes'),
}, (table) => ({
    statusIdx: (0, sqlite_core_1.index)('cash_registers_status_idx').on(table.status),
    dateIdx: (0, sqlite_core_1.index)('cash_registers_date_idx').on(table.openedAt),
}));
exports.cashMovements = (0, sqlite_core_1.sqliteTable)('cash_movements', {
    id: (0, sqlite_core_1.integer)('id').primaryKey({ autoIncrement: true }),
    cashRegisterId: (0, sqlite_core_1.integer)('cash_register_id').notNull().references(() => exports.cashRegisters.id),
    type: (0, sqlite_core_1.text)('type', { enum: ['income', 'expense', 'sale'] }).notNull(),
    amount: (0, sqlite_core_1.real)('amount').notNull(),
    concept: (0, sqlite_core_1.text)('concept').notNull(),
    description: (0, sqlite_core_1.text)('description'),
    createdAt: (0, sqlite_core_1.integer)('created_at', { mode: 'timestamp' }).default((0, drizzle_orm_1.sql) `(unixepoch())`),
}, (table) => ({
    registerIdx: (0, sqlite_core_1.index)('cash_movements_register_idx').on(table.cashRegisterId),
    typeIdx: (0, sqlite_core_1.index)('cash_movements_type_idx').on(table.type),
}));
exports.sales = (0, sqlite_core_1.sqliteTable)('sales', {
    id: (0, sqlite_core_1.integer)('id').primaryKey({ autoIncrement: true }),
    customerId: (0, sqlite_core_1.integer)('customer_id').references(() => exports.customers.id),
    cashRegisterId: (0, sqlite_core_1.integer)('cash_register_id').references(() => exports.cashRegisters.id),
    subtotal: (0, sqlite_core_1.real)('subtotal').notNull(),
    tax: (0, sqlite_core_1.real)('tax').default(0),
    discount: (0, sqlite_core_1.real)('discount').default(0),
    total: (0, sqlite_core_1.real)('total').notNull(),
    paymentMethod: (0, sqlite_core_1.text)('payment_method', {
        enum: ['cash', 'debit', 'credit', 'transfer', 'mixed']
    }).notNull(),
    status: (0, sqlite_core_1.text)('status', {
        enum: ['completed', 'suspended', 'cancelled']
    }).default('completed'),
    createdAt: (0, sqlite_core_1.integer)('created_at', { mode: 'timestamp' }).default((0, drizzle_orm_1.sql) `(unixepoch())`),
    userId: (0, sqlite_core_1.integer)('user_id'),
}, (table) => ({
    customerIdx: (0, sqlite_core_1.index)('sales_customer_idx').on(table.customerId),
    dateIdx: (0, sqlite_core_1.index)('sales_date_idx').on(table.createdAt),
    statusIdx: (0, sqlite_core_1.index)('sales_status_idx').on(table.status),
}));
exports.saleItems = (0, sqlite_core_1.sqliteTable)('sale_items', {
    id: (0, sqlite_core_1.integer)('id').primaryKey({ autoIncrement: true }),
    saleId: (0, sqlite_core_1.integer)('sale_id').notNull().references(() => exports.sales.id),
    productId: (0, sqlite_core_1.integer)('product_id').notNull().references(() => exports.products.id),
    quantity: (0, sqlite_core_1.real)('quantity').notNull(),
    price: (0, sqlite_core_1.real)('price').notNull(),
    discount: (0, sqlite_core_1.real)('discount').default(0),
    subtotal: (0, sqlite_core_1.real)('subtotal').notNull(),
}, (table) => ({
    saleIdx: (0, sqlite_core_1.index)('sale_items_sale_idx').on(table.saleId),
    productIdx: (0, sqlite_core_1.index)('sale_items_product_idx').on(table.productId),
}));
exports.settings = (0, sqlite_core_1.sqliteTable)('settings', {
    key: (0, sqlite_core_1.text)('key').primaryKey(),
    value: (0, sqlite_core_1.text)('value').notNull(),
    updatedAt: (0, sqlite_core_1.integer)('updated_at', { mode: 'timestamp' }).default((0, drizzle_orm_1.sql) `(unixepoch())`),
});
exports.users = (0, sqlite_core_1.sqliteTable)('users', {
    id: (0, sqlite_core_1.integer)('id').primaryKey({ autoIncrement: true }),
    username: (0, sqlite_core_1.text)('username').notNull().unique(),
    passwordHash: (0, sqlite_core_1.text)('password_hash').notNull(),
    fullName: (0, sqlite_core_1.text)('full_name').notNull(),
    role: (0, sqlite_core_1.text)('role', { enum: ['admin', 'cashier'] }).default('cashier'),
    isActive: (0, sqlite_core_1.integer)('is_active', { mode: 'boolean' }).default(true),
    createdAt: (0, sqlite_core_1.integer)('created_at', { mode: 'timestamp' }).default((0, drizzle_orm_1.sql) `(unixepoch())`),
});
exports.salePayments = (0, sqlite_core_1.sqliteTable)('sale_payments', {
    id: (0, sqlite_core_1.integer)('id').primaryKey({ autoIncrement: true }),
    saleId: (0, sqlite_core_1.integer)('sale_id').notNull().references(() => exports.sales.id),
    paymentMethod: (0, sqlite_core_1.text)('payment_method', {
        enum: ['cash', 'debit', 'credit', 'transfer']
    }).notNull(),
    amount: (0, sqlite_core_1.real)('amount').notNull(),
    createdAt: (0, sqlite_core_1.integer)('created_at', { mode: 'timestamp' }).default((0, drizzle_orm_1.sql) `(unixepoch())`),
}, (table) => ({
    saleIdx: (0, sqlite_core_1.index)('sale_payments_sale_idx').on(table.saleId),
    methodIdx: (0, sqlite_core_1.index)('sale_payments_method_idx').on(table.paymentMethod),
}));
