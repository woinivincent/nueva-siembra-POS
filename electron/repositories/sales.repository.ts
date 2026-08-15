// electron/repositories/sales.repository.ts
import { sqlite } from '../database/client';

export interface Sale {
  id: number;
  customer_id: number | null;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  payment_method: 'cash' | 'transfer';
  status: 'completed' | 'suspended' | 'cancelled';
  created_at: number;
  user_id: number | null;
}

export interface SaleItem {
  id: number;
  sale_id: number;
  product_id: number;
  quantity: number;
  price: number;
  discount: number;
  subtotal: number;
}

export interface SalePayment {
  id: number;
  sale_id: number;
  payment_method: 'cash' | 'debit' | 'credit' | 'transfer';
  amount: number;
  created_at: number;
}

export interface SaleDTO {
  id: number;
  customerId: number | null;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: 'cash' | 'transfer';
  status: 'completed' | 'suspended' | 'cancelled';
  createdAt: Date;
  userId: number | null;
  items?: SaleItemDTO[];
  payments?: SalePaymentDTO[];
}

export interface SaleItemDTO {
  id: number;
  saleId: number;
  productId: number;
  productName?: string;
  quantity: number;
  price: number;
  discount: number;
  subtotal: number;
}

export interface SalePaymentDTO {
  id: number;
  saleId: number;
  paymentMethod: 'cash' | 'debit' | 'credit' | 'transfer';
  amount: number;
  createdAt: Date;
}

export interface PaymentDetail {
  method: 'cash' | 'debit' | 'credit' | 'transfer';
  amount: number;
}

export interface CreateSaleData {
  customerId?: number;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: 'cash' | 'debit' | 'credit' | 'transfer';
  payments?: PaymentDetail[]; // Para pago mixto
  items: {
    productId: number;
    quantity: number;
    price: number;
    discount?: number;
    subtotal: number;
  }[];
}

function toSaleDTO(row: Sale): SaleDTO {
  return {
    id: row.id,
    customerId: row.customer_id,
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

function toSaleItemDTO(row: SaleItem & { product_name?: string }): SaleItemDTO {
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

function toSalePaymentDTO(row: SalePayment): SalePaymentDTO {
  return {
    id: row.id,
    saleId: row.sale_id,
    paymentMethod: row.payment_method,
    amount: row.amount,
    createdAt: new Date(row.created_at * 1000),
  };
}

export class SalesRepository {
  create(data: CreateSaleData): SaleDTO | null {
    try {
      const now = Math.floor(Date.now() / 1000);

      const createSale = sqlite.transaction(() => {
        // 1. Insertar venta
        const saleStmt = sqlite.prepare(`
          INSERT INTO sales (customer_id, subtotal, tax, discount, total, payment_method, status, created_at)
          VALUES (?, ?, ?, ?, ?, ?, 'completed', ?)
        `);

        const saleResult = saleStmt.run(
          data.customerId || null,
          data.subtotal,
          data.tax,
          data.discount,
          data.total,
          data.paymentMethod,
          now
        );

        const saleId = saleResult.lastInsertRowid as number;

        // 2. Insertar items
        const itemStmt = sqlite.prepare(`
          INSERT INTO sale_items (sale_id, product_id, quantity, price, discount, subtotal)
          VALUES (?, ?, ?, ?, ?, ?)
        `);

        for (const item of data.items) {
          itemStmt.run(
            saleId,
            item.productId,
            item.quantity,
            item.price,
            item.discount || 0,
            item.subtotal
          );

          // 3. Actualizar stock del producto
          const updateStock = sqlite.prepare(`
            UPDATE products SET stock = stock - ?, updated_at = ? WHERE id = ?
          `);
          updateStock.run(item.quantity, now, item.productId);
        }

        // 4. Registrar el pago. Ya no se generan movimientos de caja porque
        // no hay caja diaria: el medio de pago queda sólo para el reporte.
        const paymentStmt = sqlite.prepare(`
          INSERT INTO sale_payments (sale_id, payment_method, amount, created_at)
          VALUES (?, ?, ?, ?)
        `);

        paymentStmt.run(saleId, data.paymentMethod, data.total, now);

        return saleId;
      });

      const saleId = createSale();
      return this.getById(saleId);
    } catch (error) {
      console.error('Error creating sale:', error);
      throw error;
    }
  }

  getById(id: number): SaleDTO | null {
    try {
      const stmt = sqlite.prepare('SELECT * FROM sales WHERE id = ?');
      const result = stmt.get(id) as Sale | undefined;

      if (!result) return null;

      const sale = toSaleDTO(result);
      sale.items = this.getItemsBySaleId(id);
      sale.payments = this.getPaymentsBySaleId(id);

      return sale;
    } catch (error) {
      console.error('Error in getById:', error);
      return null;
    }
  }

  getItemsBySaleId(saleId: number): SaleItemDTO[] {
    try {
      const stmt = sqlite.prepare(`
        SELECT si.*, p.name as product_name
        FROM sale_items si
        LEFT JOIN products p ON si.product_id = p.id
        WHERE si.sale_id = ?
      `);
      const results = stmt.all(saleId) as (SaleItem & { product_name: string })[];
      return results.map(toSaleItemDTO);
    } catch (error) {
      console.error('Error in getItemsBySaleId:', error);
      return [];
    }
  }

  getPaymentsBySaleId(saleId: number): SalePaymentDTO[] {
    try {
      const stmt = sqlite.prepare(`
        SELECT * FROM sale_payments WHERE sale_id = ?
      `);
      const results = stmt.all(saleId) as SalePayment[];
      return results.map(toSalePaymentDTO);
    } catch (error) {
      console.error('Error in getPaymentsBySaleId:', error);
      return [];
    }
  }


  getToday(): SaleDTO[] {
    try {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const startTimestamp = Math.floor(startOfDay.getTime() / 1000);

      const stmt = sqlite.prepare(`
        SELECT * FROM sales
        WHERE created_at >= ? AND status = 'completed'
        ORDER BY created_at DESC
      `);
      const results = stmt.all(startTimestamp) as Sale[];
      return results.map(toSaleDTO);
    } catch (error) {
      console.error('Error in getToday:', error);
      return [];
    }
  }

  cancel(id: number): boolean {
    try {
      const sale = this.getById(id);
      if (!sale || sale.status !== 'completed') return false;

      const now = Math.floor(Date.now() / 1000);

      const cancelSale = sqlite.transaction(() => {
        // 1. Marcar venta como cancelada
        sqlite.prepare('UPDATE sales SET status = ? WHERE id = ?').run('cancelled', id);

        // 2. Restaurar stock
        if (sale.items) {
          for (const item of sale.items) {
            sqlite.prepare('UPDATE products SET stock = stock + ?, updated_at = ? WHERE id = ?')
              .run(item.quantity, now, item.productId);
          }
        }

        // 4. Eliminar pagos
        sqlite.prepare('DELETE FROM sale_payments WHERE sale_id = ?').run(id);
      });

      cancelSale();
      return true;
    } catch (error) {
      console.error('Error cancelling sale:', error);
      return false;
    }
  }

  // Obtener totales por método de pago (para reportes)
  getPaymentMethodTotals(startDate: number, endDate: number): Record<string, number> {
    try {
      const stmt = sqlite.prepare(`
        SELECT sp.payment_method, SUM(sp.amount) as total
        FROM sale_payments sp
        JOIN sales s ON sp.sale_id = s.id
        WHERE s.created_at >= ? AND s.created_at <= ? AND s.status = 'completed'
        GROUP BY sp.payment_method
      `);
      const results = stmt.all(startDate, endDate) as { payment_method: string; total: number }[];
      
      const totals: Record<string, number> = {
        cash: 0,
        debit: 0,
        credit: 0,
        transfer: 0
      };

      for (const row of results) {
        totals[row.payment_method] = row.total;
      }

      return totals;
    } catch (error) {
      console.error('Error in getPaymentMethodTotals:', error);
      return { cash: 0, debit: 0, credit: 0, transfer: 0 };
    }
  }
}

export const salesRepository = new SalesRepository();