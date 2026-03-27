// src/components/cash/CloseCashModal.tsx
import { useState, useEffect } from 'react';
import { useCashRegisterStore } from '../../stores/cash-register.stores';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function CloseCashModal({ isOpen, onClose }: Props) {
  const { summary, closeRegister, isLoading, loadSummary } = useCashRegisterStore();
  const [closingAmount, setClosingAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadSummary();
      setClosingAmount('');
      setNotes('');
      setError('');
    }
  }, [isOpen]);

  if (!isOpen || !summary) return null;

  const expectedCash = summary.cashFlow.expected;
  const enteredAmount = parseFloat(closingAmount) || 0;
  const difference = enteredAmount - expectedCash;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isNaN(enteredAmount) || enteredAmount < 0) {
      setError('Ingresá un monto válido');
      return;
    }

    const success = await closeRegister(enteredAmount, notes || undefined);
    
    if (success) {
      onClose();
    }
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">🔒 Cerrar Caja</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Resumen antes de cerrar */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-3">
          <h3 className="font-semibold text-gray-800 mb-3">📊 Resumen del turno</h3>
          
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-white p-3 rounded-lg">
              <p className="text-gray-500">Total Ventas</p>
              <p className="text-lg font-bold text-green-600">{formatMoney(summary.totalSales)}</p>
            </div>
            <div className="bg-white p-3 rounded-lg">
              <p className="text-gray-500">Transacciones</p>
              <p className="text-lg font-bold text-blue-600">{summary.totalTransactions}</p>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-3 mt-3">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Efectivo esperado:</span>
              <span className="font-semibold">{formatMoney(expectedCash)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Medios electrónicos:</span>
              <span className="font-semibold">{formatMoney(summary.electronic.total)}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Monto de cierre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Efectivo contado en caja
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                value={closingAmount}
                onChange={(e) => setClosingAmount(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
                className="w-full pl-8 pr-4 py-3 border text-black border-gray-300 rounded-lg text-xl font-semibold focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                autoFocus
              />
            </div>
          </div>

          {/* Diferencia */}
          {closingAmount && (
            <div className={`p-4 rounded-lg ${
              difference === 0 
                ? 'bg-green-50 border border-green-200' 
                : difference > 0 
                  ? 'bg-blue-50 border border-blue-200'
                  : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex justify-between items-center">
                <span className="font-medium">
                  {difference === 0 
                    ? '✅ Caja cuadrada' 
                    : difference > 0 
                      ? '📈 Sobrante'
                      : '📉 Faltante'
                  }
                </span>
                <span className={`text-xl font-bold ${
                  difference === 0 
                    ? 'text-green-600' 
                    : difference > 0 
                      ? 'text-blue-600'
                      : 'text-red-600'
                }`}>
                  {difference > 0 ? '+' : ''}{formatMoney(difference)}
                </span>
              </div>
            </div>
          )}

          {/* Notas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notas (opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observaciones del turno..."
              rows={3}
              className="w-full px-4 py-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || !closingAmount}
              className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium"
            >
              {isLoading ? 'Cerrando...' : 'Cerrar Caja'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}