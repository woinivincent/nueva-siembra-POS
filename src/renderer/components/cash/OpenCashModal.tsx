// src/components/cash/OpenCashModal.tsx
import { useState } from 'react';
import { useCashRegisterStore } from '../../stores/cash-register.stores';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function OpenCashModal({ isOpen, onClose }: Props) {
  const { openRegister, isLoading } = useCashRegisterStore();
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const openingAmount = parseFloat(amount);
    
    if (isNaN(openingAmount) || openingAmount < 0) {
      setError('Ingresá un monto válido');
      return;
    }

    const success = await openRegister(openingAmount);
    
    if (success) {
      setAmount('');
      onClose();
    }
  };

  const quickAmounts = [0, 1000, 2000, 5000, 10000];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">💵 Abrir Caja</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Monto inicial */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Monto inicial en caja
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-black">$</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
                className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg text-black text-xl font-semibold focus:ring-2 focus:ring-green-500 focus:border-green-500"
                autoFocus
              />
            </div>
          </div>

          {/* Montos rápidos */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Montos rápidos
            </label>
            <div className="grid grid-cols-5 gap-2">
              {quickAmounts.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setAmount(q.toString())}
                  className={`py-2 px-3 rounded-lg border text-sm font-medium transition-colors
                    ${amount === q.toString() 
                      ? 'bg-green-100 border-green-500 text-green-700' 
                      : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}
                >
                  {q === 0 ? '$0' : `$${(q/1000)}k`}
                </button>
              ))}
            </div>
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
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
            >
              {isLoading ? 'Abriendo...' : 'Abrir Caja'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}