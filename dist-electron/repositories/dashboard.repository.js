"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardRepository = exports.DashboardRepository = void 0;
// electron/repositories/dashboard.repository.ts
const client_js_1 = require("../database/client.js");
class DashboardRepository {
    getStats() {
        try {
            const now = new Date();
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() / 1000;
            const todayEnd = todayStart + 86400; // +24 horas
            const yesterdayStart = todayStart - 86400;
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime() / 1000;
            // Ventas de hoy
            const todayStmt = client_js_1.sqlite.prepare(`
        SELECT 
          COALESCE(SUM(total), 0) as total_sales,
          COUNT(*) as total_transactions,
          COALESCE(AVG(total), 0) as avg_ticket,
          COALESCE(SUM(CASE WHEN payment_method = 'cash' THEN total ELSE 0 END), 0) as cash,
          COALESCE(SUM(CASE WHEN payment_method = 'debit' THEN total ELSE 0 END), 0) as debit,
          COALESCE(SUM(CASE WHEN payment_method = 'credit' THEN total ELSE 0 END), 0) as credit,
          COALESCE(SUM(CASE WHEN payment_method = 'transfer' THEN total ELSE 0 END), 0) as transfer
        FROM sales
        WHERE created_at >= ? AND created_at < ? AND status = 'completed'
      `);
            const today = todayStmt.get(todayStart, todayEnd);
            // Ventas de ayer
            const yesterdayStmt = client_js_1.sqlite.prepare(`
        SELECT COALESCE(SUM(total), 0) as total_sales
        FROM sales
        WHERE created_at >= ? AND created_at < ? AND status = 'completed'
      `);
            const yesterday = yesterdayStmt.get(yesterdayStart, todayStart);
            // Ventas del mes
            const monthStmt = client_js_1.sqlite.prepare(`
        SELECT 
          COALESCE(SUM(total), 0) as total_sales,
          COUNT(*) as total_transactions
        FROM sales
        WHERE created_at >= ? AND status = 'completed'
      `);
            const month = monthStmt.get(monthStart);
            // Productos más vendidos hoy
            const topProductsStmt = client_js_1.sqlite.prepare(`
        SELECT 
          p.id,
          p.name,
          SUM(si.quantity) as quantity,
          SUM(si.subtotal) as total
        FROM sale_items si
        JOIN sales s ON si.sale_id = s.id
        JOIN products p ON si.product_id = p.id
        WHERE s.created_at >= ? AND s.created_at < ? AND s.status = 'completed'
        GROUP BY p.id
        ORDER BY quantity DESC
        LIMIT 5
      `);
            const topProducts = topProductsStmt.all(todayStart, todayEnd);
            // Stock bajo
            const lowStockStmt = client_js_1.sqlite.prepare(`
        SELECT id, name, stock, stock_min as stockMin
        FROM products
        WHERE stock <= stock_min AND is_active = 1
        ORDER BY (stock_min - stock) DESC
        LIMIT 10
      `);
            const lowStock = lowStockStmt.all();
            // Caja actual
            const cashStmt = client_js_1.sqlite.prepare(`
        SELECT 
          cr.id,
          cr.opening_amount,
          cr.status,
          COALESCE(SUM(CASE WHEN cm.type = 'sale' THEN cm.amount ELSE 0 END), 0) as sales_total,
          COALESCE(SUM(CASE WHEN cm.type = 'income' THEN cm.amount ELSE 0 END), 0) as income_total,
          COALESCE(SUM(CASE WHEN cm.type = 'expense' THEN cm.amount ELSE 0 END), 0) as expense_total,
          COUNT(CASE WHEN cm.type = 'sale' THEN 1 END) as sales_count
        FROM cash_registers cr
        LEFT JOIN cash_movements cm ON cr.id = cm.cash_register_id
        WHERE cr.status = 'open'
        GROUP BY cr.id
      `);
            const cashRegister = cashStmt.get();
            // Cumpleaños de hoy
            const month2d = String(now.getMonth() + 1).padStart(2, '0');
            const day2d = String(now.getDate()).padStart(2, '0');
            const birthdayPattern = `%-${month2d}-${day2d}`;
            const birthdayStmt = client_js_1.sqlite.prepare(`
        SELECT id, first_name || ' ' || last_name as fullName, phone
        FROM customers
        WHERE birth_date LIKE ? AND is_active = 1
      `);
            const birthdays = birthdayStmt.all(birthdayPattern);
            // Calcular crecimiento
            const salesGrowth = yesterday.total_sales > 0
                ? ((today.total_sales - yesterday.total_sales) / yesterday.total_sales) * 100
                : today.total_sales > 0 ? 100 : 0;
            return {
                todaySales: today.total_sales || 0,
                todayTransactions: today.total_transactions || 0,
                todayAvgTicket: today.avg_ticket || 0,
                yesterdaySales: yesterday.total_sales || 0,
                salesGrowth,
                todayByPayment: {
                    cash: today.cash || 0,
                    debit: today.debit || 0,
                    credit: today.credit || 0,
                    transfer: today.transfer || 0,
                },
                topProducts: topProducts.map(p => ({
                    id: p.id,
                    name: p.name,
                    quantity: p.quantity,
                    total: p.total,
                })),
                lowStockProducts: lowStock.map(p => ({
                    id: p.id,
                    name: p.name,
                    stock: p.stock,
                    stockMin: p.stockMin,
                })),
                cashRegister: cashRegister ? {
                    isOpen: cashRegister.status === 'open',
                    openingAmount: cashRegister.opening_amount,
                    currentAmount: cashRegister.opening_amount + cashRegister.sales_total + cashRegister.income_total - cashRegister.expense_total,
                    salesCount: cashRegister.sales_count,
                } : null,
                todayBirthdays: birthdays,
                monthSales: month.total_sales || 0,
                monthTransactions: month.total_transactions || 0,
            };
        }
        catch (error) {
            console.error('Error in getStats:', error);
            return {
                todaySales: 0,
                todayTransactions: 0,
                todayAvgTicket: 0,
                yesterdaySales: 0,
                salesGrowth: 0,
                todayByPayment: { cash: 0, debit: 0, credit: 0, transfer: 0 },
                topProducts: [],
                lowStockProducts: [],
                cashRegister: null,
                todayBirthdays: [],
                monthSales: 0,
                monthTransactions: 0,
            };
        }
    }
}
exports.DashboardRepository = DashboardRepository;
exports.dashboardRepository = new DashboardRepository();
