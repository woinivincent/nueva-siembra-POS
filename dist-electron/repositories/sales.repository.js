"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.salesRepository = exports.SalesRepository = void 0;
// electron/repositories/sales.repository.ts
const client_1 = require("../database/client");
function toSaleDTO(row) {
    return {
        id: row.id,
        customerId: row.customer_id,
        cashRegisterId: row.cash_register_id,
        subtotal: row.subtotal,
        tax: row.tax,
        discount: row.discount,
        total: row.total,
        paymentMethod: row.payment_method,
        status: row.status,
        createdAt: new Date(row.created_at * 1000),
        userId: row.user_id,
    };
}
function toSaleItemDTO(row) {
    return {
        id: row.id,
        saleId: row.sale_id,
        productId: row.product_id,
        productName: row.product_name,
        quantity: row.quantity,
        price: row.price,
        discount: row.discount,
        subtotal: row.subtotal,
    };
}
function toSalePaymentDTO(row) {
    return {
        id: row.id,
        saleId: row.sale_id,
        paymentMethod: row.payment_method,
        amount: row.amount,
        createdAt: new Date(row.created_at * 1000),
    };
}
class SalesRepository {
    create(data) {
        try {
            const now = Math.floor(Date.now() / 1000);
            const isMixedPayment = data.payments && data.payments.length > 1;
            const createSale = client_1.sqlite.transaction(() => {
                // 1. Insertar venta
                const saleStmt = client_1.sqlite.prepare(`
          INSERT INTO sales (customer_id, cash_register_id, subtotal, tax, discount, total, payment_method, status, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, 'completed', ?)
        `);
                const paymentMethodForSale = isMixedPayment ? 'mixed' : data.paymentMethod;
                const saleResult = saleStmt.run(data.customerId || null, data.cashRegisterId || null, data.subtotal, data.tax, data.discount, data.total, paymentMethodForSale, now);
                const saleId = saleResult.lastInsertRowid;
                // 2. Insertar items
                const itemStmt = client_1.sqlite.prepare(`
          INSERT INTO sale_items (sale_id, product_id, quantity, price, discount, subtotal)
          VALUES (?, ?, ?, ?, ?, ?)
        `);
                for (const item of data.items) {
                    itemStmt.run(saleId, item.productId, item.quantity, item.price, item.discount || 0, item.subtotal);
                    // 3. Actualizar stock del producto
                    const updateStock = client_1.sqlite.prepare(`
            UPDATE products SET stock = stock - ?, updated_at = ? WHERE id = ?
          `);
                    updateStock.run(item.quantity, now, item.productId);
                }
                // 4. Insertar pagos y movimientos de caja
                const paymentStmt = client_1.sqlite.prepare(`
          INSERT INTO sale_payments (sale_id, payment_method, amount, created_at)
          VALUES (?, ?, ?, ?)
        `);
                const movementStmt = client_1.sqlite.prepare(`
          INSERT INTO cash_movements (cash_register_id, type, amount, concept, description, created_at)
          VALUES (?, 'sale', ?, ?, ?, ?)
        `);
                if (isMixedPayment && data.payments) {
                    // Pago mixto: insertar cada pago por separado
                    for (const payment of data.payments) {
                        if (payment.amount > 0) {
                            // Insertar en sale_payments
                            paymentStmt.run(saleId, payment.method, payment.amount, now);
                            // Insertar movimiento de caja para cada método
                            if (data.cashRegisterId) {
                                const methodLabel = {
                                    cash: 'EFECTIVO',
                                    debit: 'DÉBITO',
                                    credit: 'CRÉDITO',
                                    transfer: 'TRANSFERENCIA'
                                }[payment.method];
                                movementStmt.run(data.cashRegisterId, payment.amount, `Venta #${saleId} (${methodLabel})`, `Pago mixto - ${data.items.length} productos`, now);
                            }
                        }
                    }
                }
                else {
                    // Pago simple: un solo pago
                    paymentStmt.run(saleId, data.paymentMethod, data.total, now);
                    if (data.cashRegisterId) {
                        movementStmt.run(data.cashRegisterId, data.total, `Venta #${saleId}`, `${data.items.length} productos - ${data.paymentMethod.toUpperCase()}`, now);
                    }
                }
                return saleId;
            });
            const saleId = createSale();
            return this.getById(saleId);
        }
        catch (error) {
            console.error('Error creating sale:', error);
            throw error;
        }
    }
    getById(id) {
        try {
            const stmt = client_1.sqlite.prepare('SELECT * FROM sales WHERE id = ?');
            const result = stmt.get(id);
            if (!result)
                return null;
            const sale = toSaleDTO(result);
            sale.items = this.getItemsBySaleId(id);
            sale.payments = this.getPaymentsBySaleId(id);
            return sale;
        }
        catch (error) {
            console.error('Error in getById:', error);
            return null;
        }
    }
    getItemsBySaleId(saleId) {
        try {
            const stmt = client_1.sqlite.prepare(`
        SELECT si.*, p.name as product_name
        FROM sale_items si
        LEFT JOIN products p ON si.product_id = p.id
        WHERE si.sale_id = ?
      `);
            const results = stmt.all(saleId);
            return results.map(toSaleItemDTO);
        }
        catch (error) {
            console.error('Error in getItemsBySaleId:', error);
            return [];
        }
    }
    getPaymentsBySaleId(saleId) {
        try {
            const stmt = client_1.sqlite.prepare(`
        SELECT * FROM sale_payments WHERE sale_id = ?
      `);
            const results = stmt.all(saleId);
            return results.map(toSalePaymentDTO);
        }
        catch (error) {
            console.error('Error in getPaymentsBySaleId:', error);
            return [];
        }
    }
    getByCashRegister(cashRegisterId) {
        try {
            const stmt = client_1.sqlite.prepare(`
        SELECT * FROM sales
        WHERE cash_register_id = ? AND status = 'completed'
        ORDER BY created_at DESC
      `);
            const results = stmt.all(cashRegisterId);
            return results.map(toSaleDTO);
        }
        catch (error) {
            console.error('Error in getByCashRegister:', error);
            return [];
        }
    }
    getToday() {
        try {
            const startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0);
            const startTimestamp = Math.floor(startOfDay.getTime() / 1000);
            const stmt = client_1.sqlite.prepare(`
        SELECT * FROM sales
        WHERE created_at >= ? AND status = 'completed'
        ORDER BY created_at DESC
      `);
            const results = stmt.all(startTimestamp);
            return results.map(toSaleDTO);
        }
        catch (error) {
            console.error('Error in getToday:', error);
            return [];
        }
    }
    cancel(id) {
        try {
            const sale = this.getById(id);
            if (!sale || sale.status !== 'completed')
                return false;
            const now = Math.floor(Date.now() / 1000);
            const cancelSale = client_1.sqlite.transaction(() => {
                // 1. Marcar venta como cancelada
                client_1.sqlite.prepare('UPDATE sales SET status = ? WHERE id = ?').run('cancelled', id);
                // 2. Restaurar stock
                if (sale.items) {
                    for (const item of sale.items) {
                        client_1.sqlite.prepare('UPDATE products SET stock = stock + ?, updated_at = ? WHERE id = ?')
                            .run(item.quantity, now, item.productId);
                    }
                }
                // 3. Eliminar movimientos de caja asociados (puede haber múltiples si fue pago mixto)
                if (sale.cashRegisterId) {
                    client_1.sqlite.prepare("DELETE FROM cash_movements WHERE concept LIKE ? AND cash_register_id = ?")
                        .run(`Venta #${id}%`, sale.cashRegisterId);
                }
                // 4. Eliminar pagos
                client_1.sqlite.prepare('DELETE FROM sale_payments WHERE sale_id = ?').run(id);
            });
            cancelSale();
            return true;
        }
        catch (error) {
            console.error('Error cancelling sale:', error);
            return false;
        }
    }
    // Obtener totales por método de pago (para reportes)
    getPaymentMethodTotals(startDate, endDate) {
        try {
            const stmt = client_1.sqlite.prepare(`
        SELECT sp.payment_method, SUM(sp.amount) as total
        FROM sale_payments sp
        JOIN sales s ON sp.sale_id = s.id
        WHERE s.created_at >= ? AND s.created_at <= ? AND s.status = 'completed'
        GROUP BY sp.payment_method
      `);
            const results = stmt.all(startDate, endDate);
            const totals = {
                cash: 0,
                debit: 0,
                credit: 0,
                transfer: 0
            };
            for (const row of results) {
                totals[row.payment_method] = row.total;
            }
            return totals;
        }
        catch (error) {
            console.error('Error in getPaymentMethodTotals:', error);
            return { cash: 0, debit: 0, credit: 0, transfer: 0 };
        }
    }
}
exports.SalesRepository = SalesRepository;
exports.salesRepository = new SalesRepository();
