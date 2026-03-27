// src/components/cash/NewMovementModal.tsx
import { useState, useEffect } from 'react';
import { useCashRegisterStore } from '../../stores/cash-register.stores';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  type: 'income' | 'expense';
}

const CONCEPTS = {
  income: ['Cambio', 'Préstamo', 'Devolución', 'Otro'],
  expense: ['Compra insumos', 'Pago proveedor', 'Retiro efectivo', 'Gastos varios', 'Otro'],
};

export function NewMovementModal({ isOpen, onClose, type }: Props) {
  const { addMovement, isLoading } = useCashRegisterStore();
  const [amount, setAmount] = useState('');
  const [concept, setConcept] = useState('');
  const [customConcept, setCustomConcept] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setConcept('');
      setCustomConcept('');
      setDescription('');
      setError('');
    }
  }, [isOpen, type]);

  if (!isOpen) return null;

  const isIncome = type === 'income';
  const concepts = CONCEPTS[type];
  const finalConcept = concept === 'Otro' ? customConcept : concept;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const numAmount = parseFloat(amount);
    
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Ingresá un monto válido mayor a 0');
      return;
    }

    if (!finalConcept.trim()) {
      setError('Seleccioná o ingresá un concepto');
      return;
    }

    const success = await addMovement(type, numAmount, finalConcept, description || undefined);
    
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            {isIncome ? '📥 Nuevo Ingreso' : '📤 Nuevo Egreso'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Monto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Monto
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
                className="w-full pl-8 pr-4 py-3 border border-black rounded-lg  text-black text-xl font-semibold focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                autoFocus
              />
            </div>
          </div>

          {/* Concepto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Concepto
            </label>
            <div className="grid grid-cols-2 gap-2">
              {concepts.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setConcept(c)}
                  className={`py-2 px-3 rounded-lg border  text-sm font-medium transition-colors
                    ${concept === c 
                      ? isIncome
                        ? 'bg-blue-100 border-blue-500 text-blue-700'
                        : 'bg-orange-100 border-orange-500 text-orange-700'
                      : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}
                >
                  {c}
                </button>
              ))}
            </div>
            
            {concept === 'Otro' && (
              <input
                type="text"
                value={customConcept}
                onChange={(e) => setCustomConcept(e.target.value)}
                placeholder="Especificar concepto..."
                className="w-full mt-2 px-4 py-2 border  text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            )}
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción (opcional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalle adicional..."
              className="w-full px-4 py-2 border border-gray-300  text-black rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              disabled={isLoading}
              className={`flex-1 px-4 py-3 text-white rounded-lg font-medium disabled:opacity-50
                ${isIncome 
                  ? 'bg-blue-600 hover:bg-blue-700' 
                  : 'bg-orange-600 hover:bg-orange-700'
                }`}
            >
              {isLoading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}