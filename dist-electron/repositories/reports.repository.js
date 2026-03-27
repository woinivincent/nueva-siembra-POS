"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportsRepository = exports.ReportsRepository = void 0;
// electron/repositories/reports.repository.ts
const client_js_1 = require("../database/client.js");
class ReportsRepository {
    getSalesReport(startDate, endDate) {
        try {
            const startTimestamp = Math.floor(new Date(startDate).getTime() / 1000);
            const endTimestamp = Math.floor(new Date(endDate + 'T23:59:59').getTime() / 1000);
            // Totales generales
            const totalsStmt = client_js_1.sqlite.prepare(`
        SELECT 
          COALESCE(SUM(total), 0) as total_sales,
          COUNT(*) as total_transactions,
          COALESCE(AVG(total), 0) as avg_ticket,
          COALESCE(SUM(CASE WHEN payment_method = 'cash' THEN total ELSE 0 END), 0) as cash,
          COALESCE(SUM(CASE WHEN payment_method = 'debit' THEN total ELSE 0 END), 0) as debit,
          COALESCE(SUM(CASE WHEN payment_method = 'credit' THEN total ELSE 0 END), 0) as credit,
          COALESCE(SUM(CASE WHEN payment_method = 'transfer' THEN total ELSE 0 END), 0) as transfer
        FROM sales
        WHERE created_at >= ? AND created_at <= ? AND status = 'completed'
      `);
            const totals = totalsStmt.get(startTimestamp, endTimestamp);
            // Ventas por día - usando strftime en lugar de date()
            const dailyStmt = client_js_1.sqlite.prepare(`
        SELECT 
          strftime('%Y-%m-%d', created_at, 'unixepoch', 'localtime') as date,
          COALESCE(SUM(total), 0) as total_sales,
          COUNT(*) as total_transactions,
          COALESCE(AVG(total), 0) as avg_ticket,
          COALESCE(SUM(CASE WHEN payment_method = 'cash' THEN total ELSE 0 END), 0) as cash,
          COALESCE(SUM(CASE WHEN payment_method = 'debit' THEN total ELSE 0 END), 0) as debit,
          COALESCE(SUM(CASE WHEN payment_method = 'credit' THEN total ELSE 0 END), 0) as credit,
          COALESCE(SUM(CASE WHEN payment_method = 'transfer' THEN total ELSE 0 END), 0) as transfer
        FROM sales
        WHERE created_at >= ? AND created_at <= ? AND status = 'completed'
        GROUP BY strftime('%Y-%m-%d', created_at, 'unixepoch', 'localtime')
        ORDER BY date
      `);
            const dailyData = dailyStmt.all(startTimestamp, endTimestamp);
            // Productos más vendidos
            const topProductsStmt = client_js_1.sqlite.prepare(`
        SELECT 
          si.product_id,
          p.name as product_name,
          p.category,
          SUM(si.quantity) as quantity_sold,
          SUM(si.subtotal) as total_revenue
        FROM sale_items si
        JOIN sales s ON si.sale_id = s.id
        JOIN products p ON si.product_id = p.id
        WHERE s.created_at >= ? AND s.created_at <= ? AND s.status = 'completed'
        GROUP BY si.product_id
        ORDER BY quantity_sold DESC
        LIMIT 10
      `);
            const topProducts = topProductsStmt.all(startTimestamp, endTimestamp);
            return {
                totalSales: totals.total_sales || 0,
                totalTransactions: totals.total_transactions || 0,
                avgTicket: totals.avg_ticket || 0,
                byPaymentMethod: {
                    cash: totals.cash || 0,
                    debit: totals.debit || 0,
                    credit: totals.credit || 0,
                    transfer: totals.transfer || 0,
                },
                topProducts: topProducts.map(p => ({
                    productId: p.product_id,
                    productName: p.product_name,
                    category: p.category,
                    quantitySold: p.quantity_sold,
                    totalRevenue: p.total_revenue,
                })),
                dailyData: dailyData.map(d => ({
                    date: d.date,
                    totalSales: d.total_sales,
                    totalTransactions: d.total_transactions,
                    avgTicket: d.avg_ticket,
                    cash: d.cash,
                    debit: d.debit,
                    credit: d.credit,
                    transfer: d.transfer,
                })),
            };
        }
        catch (error) {
            console.error('Error in getSalesReport:', error);
            return {
                totalSales: 0,
                totalTransactions: 0,
                avgTicket: 0,
                byPaymentMethod: { cash: 0, debit: 0, credit: 0, transfer: 0 },
                topProducts: [],
                dailyData: [],
            };
        }
    }
    getSalesForExport(startDate, endDate) {
        try {
            const startTimestamp = Math.floor(new Date(startDate).getTime() / 1000);
            const endTimestamp = Math.floor(new Date(endDate + 'T23:59:59').getTime() / 1000);
            const stmt = client_js_1.sqlite.prepare(`
        SELECT
          s.id,
          s.total,
          s.subtotal,
          s.discount,
          s.payment_method,
          s.created_at,
          c.first_name || ' ' || c.last_name as customer_name,
          (SELECT COUNT(*) FROM sale_items si WHERE si.sale_id = s.id) as items_count,
          (SELECT COALESCE(SUM(sp.amount), 0) FROM sale_payments sp WHERE sp.sale_id = s.id AND sp.payment_method = 'cash') as cash_amount,
          (SELECT COALESCE(SUM(sp.amount), 0) FROM sale_payments sp WHERE sp.sale_id = s.id AND sp.payment_method = 'debit') as debit_amount,
          (SELECT COALESCE(SUM(sp.amount), 0) FROM sale_payments sp WHERE sp.sale_id = s.id AND sp.payment_method = 'credit') as credit_amount,
          (SELECT COALESCE(SUM(sp.amount), 0) FROM sale_payments sp WHERE sp.sale_id = s.id AND sp.payment_method = 'transfer') as transfer_amount
        FROM sales s
        LEFT JOIN customers c ON s.customer_id = c.id
        WHERE s.created_at >= ? AND s.created_at <= ? AND s.status = 'completed'
        ORDER BY s.created_at DESC
      `);
            const results = stmt.all(startTimestamp, endTimestamp);
            return results.map(r => {
                const date = new Date(r.created_at * 1000);
                return {
                    id: r.id,
                    fecha: date.toLocaleDateString('es-AR'),
                    hora: date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
                    cliente: r.customer_name?.trim() || 'Sin cliente',
                    cantProductos: r.items_count,
                    subtotal: r.subtotal,
                    descuento: r.discount,
                    total: r.total,
                    efectivo: r.cash_amount,
                    debito: r.debit_amount,
                    credito: r.credit_amount,
                    transferencia: r.transfer_amount,
                };
            });
        }
        catch (error) {
            console.error('Error in getSalesForExport:', error);
            return [];
        }
    }
}
exports.ReportsRepository = ReportsRepository;
exports.reportsRepository = new ReportsRepository();
