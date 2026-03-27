"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reserveFundRepository = exports.ReserveFundRepository = void 0;
// electron/repositories/reserve-fund.repository.ts
const client_js_1 = require("../database/client.js");
function toDTO(row) {
    return {
        id: row.id,
        type: row.type,
        amount: row.amount,
        concept: row.concept,
        category: row.category,
        description: row.description,
        sourceCashRegisterId: row.source_cash_register_id,
        createdAt: new Date(row.created_at * 1000),
    };
}
class ReserveFundRepository {
    // Obtener balance actual
    getBalance() {
        try {
            const stmt = client_js_1.sqlite.prepare(`
        SELECT 
          COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) -
          COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as balance
        FROM reserve_fund
      `);
            const result = stmt.get();
            return result.balance || 0;
        }
        catch (error) {
            console.error('Error getting balance:', error);
            return 0;
        }
    }
    // Obtener todos los movimientos
    getAll(limit = 100) {
        try {
            const stmt = client_js_1.sqlite.prepare(`
        SELECT * FROM reserve_fund 
        ORDER BY created_at DESC 
        LIMIT ?
      `);
            const results = stmt.all(limit);
            return results.map(toDTO);
        }
        catch (error) {
            console.error('Error in getAll:', error);
            return [];
        }
    }
    // Obtener movimientos por categoría
    getByCategory(category) {
        try {
            const stmt = client_js_1.sqlite.prepare(`
        SELECT * FROM reserve_fund 
        WHERE category = ?
        ORDER BY created_at DESC
      `);
            const results = stmt.all(category);
            return results.map(toDTO);
        }
        catch (error) {
            console.error('Error in getByCategory:', error);
            return [];
        }
    }
    // Obtener categorías existentes
    getCategories() {
        try {
            const stmt = client_js_1.sqlite.prepare(`
        SELECT DISTINCT category FROM reserve_fund 
        WHERE category IS NOT NULL AND category != ''
        ORDER BY category
      `);
            const results = stmt.all();
            return results.map(r => r.category);
        }
        catch (error) {
            console.error('Error in getCategories:', error);
            return [];
        }
    }
    // Agregar ingreso (transferencia desde caja diaria)
    addIncome(data) {
        try {
            const stmt = client_js_1.sqlite.prepare(`
        INSERT INTO reserve_fund (type, amount, concept, category, description, source_cash_register_id, created_at)
        VALUES ('income', ?, ?, ?, ?, ?, strftime('%s', 'now'))
      `);
            const result = stmt.run(data.amount, data.concept, data.category || null, data.description || null, data.sourceCashRegisterId || null);
            return this.getById(result.lastInsertRowid);
        }
        catch (error) {
            console.error('Error in addIncome:', error);
            return null;
        }
    }
    // Agregar egreso (pago de cuentas, insumos, etc.)
    addExpense(data) {
        try {
            const balance = this.getBalance();
            if (data.amount > balance) {
                throw new Error(`Fondos insuficientes. Disponible: $${balance.toFixed(2)}`);
            }
            const stmt = client_js_1.sqlite.prepare(`
        INSERT INTO reserve_fund (type, amount, concept, category, description, created_at)
        VALUES ('expense', ?, ?, ?, ?, strftime('%s', 'now'))
      `);
            const result = stmt.run(data.amount, data.concept, data.category || null, data.description || null);
            return this.getById(result.lastInsertRowid);
        }
        catch (error) {
            console.error('Error in addExpense:', error);
            throw error;
        }
    }
    // Transferir desde caja diaria a reserva
    transferFromCashRegister(cashRegisterId, amount, concept, category) {
        try {
            const transaction = client_js_1.sqlite.transaction(() => {
                // 1. Registrar egreso en caja diaria
                const movementStmt = client_js_1.sqlite.prepare(`
          INSERT INTO cash_movements (cash_register_id, type, amount, concept, description, created_at)
          VALUES (?, 'expense', ?, ?, 'Transferencia a Caja Reserva', strftime('%s', 'now'))
        `);
                movementStmt.run(cashRegisterId, amount, `Reserva: ${concept}`);
                // 2. Registrar ingreso en caja reserva
                const reserveStmt = client_js_1.sqlite.prepare(`
          INSERT INTO reserve_fund (type, amount, concept, category, description, source_cash_register_id, created_at)
          VALUES ('income', ?, ?, ?, 'Transferencia desde Caja Diaria', ?, strftime('%s', 'now'))
        `);
                const result = reserveStmt.run(amount, concept, category || null, cashRegisterId);
                return result.lastInsertRowid;
            });
            const newId = transaction();
            return this.getById(newId);
        }
        catch (error) {
            console.error('Error in transferFromCashRegister:', error);
            throw error;
        }
    }
    getById(id) {
        try {
            const stmt = client_js_1.sqlite.prepare('SELECT * FROM reserve_fund WHERE id = ?');
            const result = stmt.get(id);
            return result ? toDTO(result) : null;
        }
        catch (error) {
            console.error('Error in getById:', error);
            return null;
        }
    }
    // Eliminar movimiento
    delete(id) {
        try {
            const stmt = client_js_1.sqlite.prepare('DELETE FROM reserve_fund WHERE id = ?');
            stmt.run(id);
            return true;
        }
        catch (error) {
            console.error('Error in delete:', error);
            return false;
        }
    }
    // Resumen por categoría
    getSummaryByCategory() {
        try {
            const stmt = client_js_1.sqlite.prepare(`
        SELECT 
          COALESCE(category, 'Sin categoría') as category,
          COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as income,
          COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expense
        FROM reserve_fund
        GROUP BY category
        ORDER BY category
      `);
            const results = stmt.all();
            return results.map(r => ({
                ...r,
                balance: r.income - r.expense
            }));
        }
        catch (error) {
            console.error('Error in getSummaryByCategory:', error);
            return [];
        }
    }
    // Resumen general
    getSummary() {
        try {
            const stmt = client_js_1.sqlite.prepare(`
        SELECT 
          COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income,
          COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expense,
          COUNT(*) as movements_count
        FROM reserve_fund
      `);
            const result = stmt.get();
            return {
                totalIncome: result.total_income,
                totalExpense: result.total_expense,
                balance: result.total_income - result.total_expense,
                movementsCount: result.movements_count
            };
        }
        catch (error) {
            console.error('Error in getSummary:', error);
            return { totalIncome: 0, totalExpense: 0, balance: 0, movementsCount: 0 };
        }
    }
}
exports.ReserveFundRepository = ReserveFundRepository;
exports.reserveFundRepository = new ReserveFundRepository();
