// src/renderer/components/expenses/ExpenseFormModal.tsx
import { useEffect, useState } from 'react';
import { X, Briefcase, Users } from 'lucide-react';
import type { ExpenseType, ExpensePaymentMethod } from '@/shared/types/electron';

interface Props {
  isOpen: boolean;
  /** Negocio o sueldo: se elige antes de abrir, desde los botones de la página. */
  type: ExpenseType;
  onClose: () => void;
  onSaved: () => void;
}

const CONCEPTS: Record<ExpenseType, string[]> = {
  business: ['Proveedor', 'Insumos', 'Servicios', 'Combustible', 'Reparto', 'Otro'],
  salary: ['Sueldo', 'Adelanto', 'Aguinaldo', 'Otro'],
};

function today(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

export function ExpenseFormModal({ isOpen, type, onClose, onSaved }: Props) {
  const [amount, setAmount] = useState('');
  const [concept, setConcept] = useState('');
  const [customConcept, setCustomConcept] = useState('');
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<ExpensePaymentMethod>('cash');
  const [date, setDate] = useState(today());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setConcept('');
      setCustomConcept('');
      setDescription('');
      setPaymentMethod('cash');
      setDate(today());
      setError(null);
    }
  }, [isOpen, type]);

  if (!isOpen) return null;

  const isSalary = type === 'salary';
  const finalConcept = concept === 'Otro' ? customConcept.trim() : concept;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const value = parseFloat(amount);
    if (isNaN(value) || value <= 0) {
      setError('El monto debe ser mayor a 0');
      return;
    }
    if (!finalConcept) {
      setError('Seleccioná o ingresá un concepto');
      return;
    }

    setIsLoading(true);
    try {
      await window.electronAPI.expenses.create({
        type,
        amount: value,
        concept: finalConcept,
        description: description.trim() || null,
        paymentMethod,
        date,
      });
      onSaved();
    } catch (err: any) {
      console.error('Error saving expense:', err);
      setError(err.message || 'Error al guardar el egreso');
    } finally {
      setIsLoading(false);
    }
  };

  const accent = isSalary
    ? { text: 'text-purple-600', bg: 'bg-purple-500/15', ring: 'focus:ring-purple-500' }
    : { text: 'text-blue-600', bg: 'bg-blue-500/15', ring: 'focus:ring-blue-500' };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full ${accent.bg} flex items-center justify-center`}>
              {isSalary ? (
                <Users className={`w-5 h-5 ${accent.text}`} />
              ) : (
                <Briefcase className={`w-5 h-5 ${accent.text}`} />
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Egreso de {isSalary ? 'Sueldo' : 'Negocio'}
              </h2>
              <p className="text-xs text-gray-500">Registrar salida de dinero</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Monto *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                autoFocus
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={`w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 ${accent.ring} bg-white text-gray-900`}
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Concepto *</label>
            <div className="flex flex-wrap gap-2">
              {CONCEPTS[type].map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setConcept(option)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium border transition-colors ${
                    concept === option
                      ? `${accent.bg} ${accent.text} border-current`
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
            {concept === 'Otro' && (
              <input
                type="text"
                value={customConcept}
                onChange={(e) => setCustomConcept(e.target.value)}
                className={`mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 ${accent.ring} bg-white text-gray-900`}
                placeholder="Escribí el concepto"
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Medio de pago</label>
            <div className="grid grid-cols-2 gap-2">
              {(['cash', 'transfer'] as const).map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  className={`rounded-lg py-2 text-sm font-medium border transition-colors ${
                    paymentMethod === method
                      ? `${accent.bg} ${accent.text} border-current`
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {method === 'cash' ? 'Efectivo' : 'Transferencia'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 ${accent.ring} bg-white text-gray-900`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Detalle (opcional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 ${accent.ring} bg-white text-gray-900`}
              placeholder="Nota adicional"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={`flex-1 py-2 rounded-lg font-medium text-white disabled:opacity-50 ${
                isSalary ? 'bg-purple-600 hover:bg-purple-700' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isLoading ? 'Guardando…' : 'Registrar egreso'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
