// electron/repositories/expenses.repository.ts
import { sqlite } from '../database/client.js';

export type ExpenseType = 'business' | 'salary';
export type ExpensePaymentMethod = 'cash' | 'transfer';

interface ExpenseRow {
  id: number;
  type: ExpenseType;
  amount: number;
  concept: string;
  description: string | null;
  payment_method: ExpensePaymentMethod;
  date: number;
  created_at: number | null;
}

export interface ExpenseDTO {
  id: number;
  type: ExpenseType;
  amount: number;
  concept: string;
  description: string | null;
  paymentMethod: ExpensePaymentMethod;
  date: Date;
  createdAt: Date | null;
}

export interface ExpenseInput {
  type: ExpenseType;
  amount: number;
  concept: string;
  description?: string | null;
  paymentMethod: ExpensePaymentMethod;
  /** Fecha del egreso en formato YYYY-MM-DD. Si no viene, se usa hoy. */
  date?: string;
}

/** Totales de un período, separados por tipo para el reporte. */
export interface ExpensesSummary {
  total: number;
  business: number;
  salary: number;
  totalCash: number;
  totalTransfer: number;
  expenses: ExpenseDTO[];
}

function toDTO(row: ExpenseRow): ExpenseDTO {
  return {
    id: row.id,
    type: row.type,
    amount: row.amount,
    concept: row.concept,
    description: row.description,
    paymentMethod: row.payment_method,
    date: new Date(row.date * 1000),
    createdAt: row.created_at ? new Date(row.created_at * 1000) : null,
  };
}

/** Inicio del día local en segundos epoch. */
function startOfDay(date: string): number {
  return Math.floor(new Date(`${date}T00:00:00`).getTime() / 1000);
}

/** Fin del día local en segundos epoch. */
function endOfDay(date: string): number {
  return Math.floor(new Date(`${date}T23:59:59.999`).getTime() / 1000);
}

export class ExpensesRepository {
  getAll(limit = 200): ExpenseDTO[] {
    try {
      const stmt = sqlite.prepare(
        'SELECT * FROM expenses ORDER BY date DESC, id DESC LIMIT ?',
      );
      return (stmt.all(limit) as ExpenseRow[]).map(toDTO);
    } catch (error) {
      console.error('Error in expenses.getAll:', error);
      return [];
    }
  }

  getByDateRange(startDate: string, endDate: string): ExpenseDTO[] {
    try {
      const stmt = sqlite.prepare(
        'SELECT * FROM expenses WHERE date >= ? AND date <= ? ORDER BY date DESC, id DESC',
      );
      return (stmt.all(startOfDay(startDate), endOfDay(endDate)) as ExpenseRow[]).map(toDTO);
    } catch (error) {
      console.error('Error in expenses.getByDateRange:', error);
      return [];
    }
  }

  /**
   * Totales del período separados en negocio y sueldo, que es como se
   * muestran en el reporte.
   */
  getSummary(startDate: string, endDate: string): ExpensesSummary {
    const expenses = this.getByDateRange(startDate, endDate);

    const sum = (predicate: (e: ExpenseDTO) => boolean) =>
      expenses.filter(predicate).reduce((total, e) => total + e.amount, 0);

    return {
      total: sum(() => true),
      business: sum((e) => e.type === 'business'),
      salary: sum((e) => e.type === 'salary'),
      totalCash: sum((e) => e.paymentMethod === 'cash'),
      totalTransfer: sum((e) => e.paymentMethod === 'transfer'),
      expenses,
    };
  }

  create(data: ExpenseInput): ExpenseDTO | null {
    try {
      const date = data.date ? startOfDay(data.date) : Math.floor(Date.now() / 1000);
      const stmt = sqlite.prepare(`
        INSERT INTO expenses (type, amount, concept, description, payment_method, date)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      const result = stmt.run(
        data.type,
        data.amount,
        data.concept,
        data.description ?? null,
        data.paymentMethod,
        date,
      );
      return this.getById(result.lastInsertRowid as number);
    } catch (error) {
      console.error('Error in expenses.create:', error);
      return null;
    }
  }

  getById(id: number): ExpenseDTO | null {
    try {
      const row = sqlite.prepare('SELECT * FROM expenses WHERE id = ?').get(id) as
        | ExpenseRow
        | undefined;
      return row ? toDTO(row) : null;
    } catch (error) {
      console.error('Error in expenses.getById:', error);
      return null;
    }
  }

  delete(id: number): boolean {
    try {
      const result = sqlite.prepare('DELETE FROM expenses WHERE id = ?').run(id);
      return result.changes > 0;
    } catch (error) {
      console.error('Error in expenses.delete:', error);
      return false;
    }
  }
}

export const expensesRepository = new ExpensesRepository();
