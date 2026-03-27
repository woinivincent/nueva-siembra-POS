// electron/repositories/cash-register.repository.ts
import { sqlite } from '../database/client.js';

export interface CashRegister {
  id: number;
  opened_at: number;
  closed_at: number | null;
  opening_amount: number;
  closing_amount: number | null;
  expected_amount: number | null;
  difference: number | null;
  status: 'open' | 'closed';
  user_id: number | null;
  notes: string | null;
}

export interface CashMovement {
  id: number;
  cash_register_id: number;
  type: 'income' | 'expense' | 'sale';
  amount: number;
  concept: string;
  description: string | null;
  payment_method: string | null;
  created_at: number;
}

export interface CashRegisterDTO {
  id: number;
  openedAt: Date;
  closedAt: Date | null;
  openingAmount: number;
  closingAmount: number | null;
  expectedAmount: number | null;
  difference: number | null;
  status: 'open' | 'closed';
  userId: number | null;
  notes: string | null;
}

export interface CashMovementDTO {
  id: number;
  cashRegisterId: number;
  type: 'income' | 'expense' | 'sale';
  amount: number;
  concept: string;
  description: string | null;
  paymentMethod: 'cash' | 'transfer';
  createdAt: Date;
}

function toRegisterDTO(row: CashRegister): CashRegisterDTO {
  return {
    id: row.id,
    openedAt: new Date(row.opened_at * 1000),
    closedAt: row.closed_at ? new Date(row.closed_at * 1000) : null,
    openingAmount: row.opening_amount,
    closingAmount: row.closing_amount,
    expectedAmount: row.expected_amount,
    difference: row.difference,
    status: row.status,
    userId: row.user_id,
    notes: row.notes,
  };
}

function toMovementDTO(row: CashMovement): CashMovementDTO {
  return {
    id: row.id,
    cashRegisterId: row.cash_register_id,
    type: row.type,
    amount: row.amount,
    concept: row.concept,
    description: row.description,
    paymentMethod: (row.payment_method as 'cash' | 'transfer') || 'cash',
    createdAt: new Date(row.created_at * 1000),
  };
}

export class CashRegisterRepository {
  // Obtener caja abierta actual
  getOpenRegister(): CashRegisterDTO | null {
    try {
      const stmt = sqlite.prepare("SELECT * FROM cash_registers WHERE status = 'open' ORDER BY opened_at DESC LIMIT 1");
      const result = stmt.get() as CashRegister | undefined;
      return result ? toRegisterDTO(result) : null;
    } catch (error) {
      console.error('Error in getOpenRegister:', error);
      return null;
    }
  }

  // Abrir nueva caja
  openRegister(openingAmount: number, userId?: number): CashRegisterDTO | null {
    try {
      // Verificar que no haya caja abierta
      const existing = this.getOpenRegister();
      if (existing) {
        throw new Error('Ya existe una caja abierta');
      }

      const stmt = sqlite.prepare(`
        INSERT INTO cash_registers (opened_at, opening_amount, status, user_id)
        VALUES (?, ?, 'open', ?)
      `);
      
      const now = Math.floor(Date.now() / 1000);
      const result = stmt.run(now, openingAmount, userId || null);
      
      return this.getById(result.lastInsertRowid as number);
    } catch (error) {
      console.error('Error in openRegister:', error);
      throw error;
    }
  }

  // Cerrar caja
  closeRegister(id: number, closingAmount: number, notes?: string): CashRegisterDTO | null {
    try {
      // Calcular monto esperado
      const expectedAmount = this.calculateExpectedAmount(id);
      const difference = closingAmount - expectedAmount;
      const now = Math.floor(Date.now() / 1000);

      const stmt = sqlite.prepare(`
        UPDATE cash_registers 
        SET closed_at = ?, closing_amount = ?, expected_amount = ?, difference = ?, status = 'closed', notes = ?
        WHERE id = ?
      `);
      
      stmt.run(now, closingAmount, expectedAmount, difference, notes || null, id);
      
      return this.getById(id);
    } catch (error) {
      console.error('Error in closeRegister:', error);
      throw error;
    }
  }

  // Calcular monto esperado en caja
  calculateExpectedAmount(registerId: number): number {
    try {
      const register = this.getById(registerId);
      if (!register) return 0;

      // Importante: el "efectivo esperado" debe sumar SOLO ventas en efectivo
      // (los pagos débito/crédito/transferencia no están físicamente en la caja).
      const salesByMethod = this.getSalesByPaymentMethod(registerId);

      // Movimientos manuales (ingresos/egresos) excluyendo ventas
      // Solo los egresos en efectivo afectan el saldo de caja física
      const movementsStmt = sqlite.prepare(`
        SELECT
          COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as totalIncome,
          COALESCE(SUM(CASE WHEN type = 'expense' AND COALESCE(payment_method, 'cash') = 'cash' THEN amount ELSE 0 END), 0) as totalExpense
        FROM cash_movements
        WHERE cash_register_id = ? AND type != 'sale'
      `);

      const movements = movementsStmt.get(registerId) as {
        totalIncome: number;
        totalExpense: number;
      };

      return (
        register.openingAmount +
        salesByMethod.cash.total +
        movements.totalIncome -
        movements.totalExpense
      );
    } catch (error) {
      console.error('Error in calculateExpectedAmount:', error);
      return 0;
    }
  }

  // Obtener resumen de caja
  getRegisterSummary(registerId: number) {
    try {
      const register = this.getById(registerId);
      if (!register) return null;

      const stmt = sqlite.prepare(`
        SELECT
          COALESCE(SUM(CASE WHEN type = 'sale' THEN amount ELSE 0 END), 0) as totalSales,
          COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as totalIncome,
          COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as totalExpense,
          COALESCE(SUM(CASE WHEN type = 'expense' AND COALESCE(payment_method, 'cash') = 'transfer' THEN amount ELSE 0 END), 0) as totalExpenseTransfer,
          COUNT(CASE WHEN type = 'sale' THEN 1 END) as salesCount
        FROM cash_movements
        WHERE cash_register_id = ?
      `);
      
      const movements = stmt.get(registerId) as {
        totalSales: number;
        totalIncome: number;
        totalExpense: number;
        salesCount: number;
      };

      return {
        register,
        ...movements,
        expectedAmount: this.calculateExpectedAmount(registerId),
      };
    } catch (error) {
      console.error('Error in getRegisterSummary:', error);
      return null;
    }
  }

  getById(id: number): CashRegisterDTO | null {
    try {
      const stmt = sqlite.prepare('SELECT * FROM cash_registers WHERE id = ?');
      const result = stmt.get(id) as CashRegister | undefined;
      return result ? toRegisterDTO(result) : null;
    } catch (error) {
      console.error('Error in getById:', error);
      return null;
    }
  }

  // Historial de cajas
  getHistory(limit = 30): CashRegisterDTO[] {
    try {
      const stmt = sqlite.prepare('SELECT * FROM cash_registers ORDER BY opened_at DESC LIMIT ?');
      const results = stmt.all(limit) as CashRegister[];
      return results.map(toRegisterDTO);
    } catch (error) {
      console.error('Error in getHistory:', error);
      return [];
    }
  }

  // === MOVIMIENTOS ===

  addMovement(data: {
    cashRegisterId: number;
    type: 'income' | 'expense' | 'sale';
    amount: number;
    concept: string;
    description?: string;
    paymentMethod?: 'cash' | 'transfer';
  }): CashMovementDTO | null {
    try {
      const stmt = sqlite.prepare(`
        INSERT INTO cash_movements (cash_register_id, type, amount, concept, description, payment_method, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      const now = Math.floor(Date.now() / 1000);
      const result = stmt.run(
        data.cashRegisterId,
        data.type,
        data.amount,
        data.concept,
        data.description || null,
        data.paymentMethod || 'cash',
        now
      );
      
      return this.getMovementById(result.lastInsertRowid as number);
    } catch (error) {
      console.error('Error in addMovement:', error);
      return null;
    }
  }

  getMovementById(id: number): CashMovementDTO | null {
    try {
      const stmt = sqlite.prepare('SELECT * FROM cash_movements WHERE id = ?');
      const result = stmt.get(id) as CashMovement | undefined;
      return result ? toMovementDTO(result) : null;
    } catch (error) {
      console.error('Error in getMovementById:', error);
      return null;
    }
  }

  getMovementsByRegister(registerId: number): CashMovementDTO[] {
    try {
      const stmt = sqlite.prepare('SELECT * FROM cash_movements WHERE cash_register_id = ? ORDER BY created_at DESC');
      const results = stmt.all(registerId) as CashMovement[];
      return results.map(toMovementDTO);
    } catch (error) {
      console.error('Error in getMovementsByRegister:', error);
      return [];
    }
  }

  deleteMovement(id: number): boolean {
    try {
      const stmt = sqlite.prepare('DELETE FROM cash_movements WHERE id = ? AND type != ?');
      const result = stmt.run(id, 'sale'); // No permitir borrar ventas
      return result.changes > 0;
    } catch (error) {
      console.error('Error in deleteMovement:', error);
      return false;
    }
  }
  // Obtener ventas agrupadas por método de pago
 getSalesByPaymentMethod(registerId: number) {
    try {
      const stmt = sqlite.prepare(`
        SELECT
          sp.payment_method,
          COUNT(DISTINCT sp.sale_id) as count,
          COALESCE(SUM(sp.amount), 0) as total
        FROM sale_payments sp
        JOIN sales s ON sp.sale_id = s.id
        WHERE s.cash_register_id = ? AND s.status = 'completed'
        GROUP BY sp.payment_method
      `);

      const results = stmt.all(registerId) as { payment_method: string; count: number; total: number }[];

      // Estructura con todos los métodos
      const summary = {
        cash: { count: 0, total: 0 },
        debit: { count: 0, total: 0 },
        credit: { count: 0, total: 0 },
        transfer: { count: 0, total: 0 },
      };

      results.forEach(row => {
        if (row.payment_method in summary) {
          summary[row.payment_method as keyof typeof summary] = {
            count: row.count,
            total: row.total,
          };
        }
      });

      return summary;
    } catch (error) {
      console.error('Error in getSalesByPaymentMethod:', error);
      return {
        cash: { count: 0, total: 0 },
        debit: { count: 0, total: 0 },
        credit: { count: 0, total: 0 },
        transfer: { count: 0, total: 0 },
      };
    }
  }

  // Resumen completo para cierre de caja
  getClosingSummary(registerId: number) {
    try {
      const register = this.getById(registerId);
      if (!register) return null;

      // Ventas por método de pago
      const salesByMethod = this.getSalesByPaymentMethod(registerId);
      
      // Movimientos de caja (ingresos/egresos manuales)
      // Solo egresos en efectivo afectan el saldo físico de caja
      const movementsStmt = sqlite.prepare(`
        SELECT
          COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as totalIncome,
          COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as totalExpense,
          COALESCE(SUM(CASE WHEN type = 'expense' AND COALESCE(payment_method, 'cash') = 'cash' THEN amount ELSE 0 END), 0) as totalExpenseCash,
          COALESCE(SUM(CASE WHEN type = 'expense' AND payment_method = 'transfer' THEN amount ELSE 0 END), 0) as totalExpenseTransfer
        FROM cash_movements
        WHERE cash_register_id = ? AND type != 'sale'
      `);

      const movements = movementsStmt.get(registerId) as {
        totalIncome: number;
        totalExpense: number;
        totalExpenseCash: number;
        totalExpenseTransfer: number;
      };

      // Cálculos de efectivo (solo egresos en efectivo restan de la caja física)
      const cashFlow = {
        opening: register.openingAmount,
        salesCash: salesByMethod.cash.total,
        income: movements.totalIncome,
        expense: movements.totalExpense,
        expenseCash: movements.totalExpenseCash,
        expenseTransfer: movements.totalExpenseTransfer,
        expected: register.openingAmount + salesByMethod.cash.total + movements.totalIncome - movements.totalExpenseCash,
      };

      // Cálculos electrónicos
      const electronic = {
        debit: salesByMethod.debit,
        credit: salesByMethod.credit,
        transfer: salesByMethod.transfer,
        total: salesByMethod.debit.total + salesByMethod.credit.total + salesByMethod.transfer.total,
      };

      // Totales generales
      const totalSales = salesByMethod.cash.total + electronic.total;
      const totalTransactions = salesByMethod.cash.count + salesByMethod.debit.count + 
                                salesByMethod.credit.count + salesByMethod.transfer.count;

      return {
        register,
        cashFlow,
        electronic,
        totalSales,
        totalTransactions,
        movements,
      };
    } catch (error) {
      console.error('Error in getClosingSummary:', error);
      return null;
    }
  }
}

export const cashRegisterRepository = new CashRegisterRepository();