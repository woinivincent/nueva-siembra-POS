// src/renderer/pages/Expenses.tsx
import { useEffect, useState } from 'react';
import { Plus, Trash2, Briefcase, Users, Banknote, ArrowLeftRight } from 'lucide-react';
import type { Expense, ExpenseType } from '@/shared/types/electron';
import { ExpenseFormModal } from '@/renderer/components/expenses/ExpenseFormModal';

const TYPE_LABEL: Record<ExpenseType, string> = {
  business: 'Negocio',
  salary: 'Sueldo',
};

export function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  // Tipo con el que se abre el formulario: se elige antes, desde los dos botones
  const [formType, setFormType] = useState<ExpenseType | null>(null);

  useEffect(() => {
    loadExpenses();
  }, []);

  async function loadExpenses() {
    try {
      const data = await window.electronAPI.expenses.getAll();
      setExpenses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading expenses:', error);
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(expense: Expense) {
    const confirmed = window.confirm(
      `¿Eliminar el egreso "${expense.concept}" por ${formatMoney(expense.amount)}?`,
    );
    if (!confirmed) return;

    await window.electronAPI.expenses.delete(expense.id);
    loadExpenses();
  }

  const formatMoney = (amount: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount);

  const formatDate = (date: Date | string) =>
    new Date(date).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const totalBusiness = expenses
    .filter((e) => e.type === 'business')
    .reduce((sum, e) => sum + e.amount, 0);
  const totalSalary = expenses
    .filter((e) => e.type === 'salary')
    .reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Egresos</h1>
        <p className="text-sm text-muted-foreground">
          Salidas de dinero, separadas entre gastos del negocio y sueldos
        </p>
      </div>

      {/* Los dos botones para egresar dinero */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => setFormType('business')}
          className="flex items-center gap-4 rounded-xl border-2 border-brand-orange/50 bg-brand-orange/5 p-5 text-left hover:bg-brand-orange/10 transition-colors"
        >
          <div className="w-12 h-12 rounded-full bg-brand-orange/20 flex items-center justify-center flex-shrink-0">
            <Briefcase className="w-6 h-6 text-brand-orange" />
          </div>
          <div className="flex-1">
            <p className="font-semibold flex items-center gap-2">
              <Plus className="w-4 h-4" /> Egreso de Negocio
            </p>
            <p className="text-sm text-muted-foreground">
              Proveedores, insumos, servicios
            </p>
          </div>
          <span className="text-lg font-bold text-brand-orange tabular-nums">
            {formatMoney(totalBusiness)}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFormType('salary')}
          className="flex items-center gap-4 rounded-xl border-2 border-brand-yellow/60 bg-brand-yellow/10 p-5 text-left hover:bg-brand-yellow/20 transition-colors"
        >
          <div className="w-12 h-12 rounded-full bg-brand-yellow/30 flex items-center justify-center flex-shrink-0">
            <Users className="w-6 h-6 text-brand-dark" />
          </div>
          <div className="flex-1">
            <p className="font-semibold flex items-center gap-2">
              <Plus className="w-4 h-4" /> Egreso de Sueldo
            </p>
            <p className="text-sm text-muted-foreground">Pagos de sueldos</p>
          </div>
          <span className="text-lg font-bold text-brand-dark tabular-nums">
            {formatMoney(totalSalary)}
          </span>
        </button>
      </div>

      {/* Historial */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-card">
          <h2 className="font-semibold">Últimos egresos</h2>
        </div>

        {loading ? (
          <p className="p-6 text-center text-muted-foreground">Cargando…</p>
        ) : expenses.length === 0 ? (
          <p className="p-6 text-center text-muted-foreground">
            Todavía no hay egresos cargados
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">Fecha</th>
                  <th className="px-4 py-2 text-left font-medium">Tipo</th>
                  <th className="px-4 py-2 text-left font-medium">Concepto</th>
                  <th className="px-4 py-2 text-left font-medium">Medio</th>
                  <th className="px-4 py-2 text-right font-medium">Monto</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => (
                  <tr key={expense.id} className="border-t border-border hover:bg-accent/40">
                    <td className="px-4 py-2 whitespace-nowrap">{formatDate(expense.date)}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                          expense.type === 'business'
                            ? 'bg-brand-orange/20 text-brand-orange'
                            : 'bg-brand-yellow/30 text-brand-dark'
                        }`}
                      >
                        {TYPE_LABEL[expense.type]}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <p className="font-medium">{expense.concept}</p>
                      {expense.description && (
                        <p className="text-xs text-muted-foreground">{expense.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        {expense.paymentMethod === 'cash' ? (
                          <>
                            <Banknote className="w-3 h-3" /> Efectivo
                          </>
                        ) : (
                          <>
                            <ArrowLeftRight className="w-3 h-3" /> Transferencia
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right font-semibold tabular-nums text-destructive">
                      {formatMoney(expense.amount)}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(expense)}
                        className="text-destructive hover:opacity-70"
                        title="Eliminar egreso"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ExpenseFormModal
        isOpen={formType !== null}
        type={formType ?? 'business'}
        onClose={() => setFormType(null)}
        onSaved={() => {
          setFormType(null);
          loadExpenses();
        }}
      />
    </div>
  );
}
