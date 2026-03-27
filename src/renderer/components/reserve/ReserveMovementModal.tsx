// src/renderer/components/reserve/ReserveMovementModal.tsx
import { useState, useEffect } from 'react';
import { X, Plus, Minus } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  type: 'income' | 'expense';
  categories: string[];
  currentBalance: number;
}

const COMMON_CATEGORIES = [
  'Alquiler',
  'Servicios',
  'Impuestos',
  'Insumos',
  'Mantenimiento',
  'Sueldos',
  'Otros'
];

export function ReserveMovementModal({ isOpen, onClose, onSaved, type, categories, currentBalance }: Props) {
  const [formData, setFormData] = useState({
    amount: '',
    concept: '',
    category: '',
    newCategory: '',
    description: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useNewCategory, setUseNewCategory] = useState(false);

  const allCategories = [...new Set([...categories, ...COMMON_CATEGORIES])].sort();

  useEffect(() => {
    if (isOpen) {
      setFormData({
        amount: '',
        concept: '',
        category: allCategories[0] || '',
        newCategory: '',
        description: '',
      });
      setError(null);
      setUseNewCategory(false);
    }
  }, [isOpen, type]);

  if (!isOpen) return null;

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      setError('Ingresá un monto válido');
      return;
    }

    if (!formData.concept.trim()) {
      setError('El concepto es requerido');
      return;
    }

    if (type === 'expense' && amount > currentBalance) {
      setError(`Fondos insuficientes. Disponible: $${currentBalance.toFixed(2)}`);
      return;
    }

    setIsLoading(true);

    try {
      const category = useNewCategory ? formData.newCategory.trim() : formData.category;
      
      const data = {
        amount,
        concept: formData.concept.trim(),
        category: category || undefined,
        description: formData.description.trim() || undefined,
      };

      if (type === 'income') {
        await window.electronAPI.reserve.addIncome(data);
      } else {
        await window.electronAPI.reserve.addExpense(data);
      }

      onSaved();
    } catch (err: any) {
      console.error('Error saving movement:', err);
      setError(err.message || 'Error al guardar el movimiento');
    } finally {
      setIsLoading(false);
    }
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${
          type === 'income' ? 'bg-green-50' : 'bg-red-50'
        }`}>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            {type === 'income' ? (
              <><Plus className="w-5 h-5 text-green-600" /> Ingreso Manual</>
            ) : (
              <><Minus className="w-5 h-5 text-red-600" /> Registrar Gasto</>
            )}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Balance actual */}
        {type === 'expense' && (
          <div className="px-6 py-3 bg-amber-50 border-b">
            <p className="text-sm text-amber-700">
              💰 Balance disponible: <strong>{formatMoney(currentBalance)}</strong>
            </p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Monto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Monto *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => handleChange('amount', e.target.value)}
                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900 bg-white"
                placeholder="0.00"
                autoFocus
              />
            </div>
          </div>

          {/* Concepto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Concepto *
            </label>
            <input
              type="text"
              value={formData.concept}
              onChange={(e) => handleChange('concept', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900 bg-white"
              placeholder={type === 'expense' ? 'Ej: Pago de alquiler Enero' : 'Ej: Depósito adicional'}
            />
          </div>

          {/* Categoría */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categoría
            </label>
            <div className="flex gap-2">
              {!useNewCategory ? (
                <>
                  <select
                    value={formData.category}
                    onChange={(e) => handleChange('category', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900 bg-white"
                  >
                    <option value="">Sin categoría</option>
                    {allCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setUseNewCategory(true)}
                    className="px-3 py-2 text-amber-600 hover:bg-amber-50 rounded-lg text-sm"
                  >
                    + Nueva
                  </button>
                </>
              ) : (
                <>
                  <input
                    type="text"
                    value={formData.newCategory}
                    onChange={(e) => handleChange('newCategory', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900 bg-white"
                    placeholder="Nueva categoría"
                  />
                  <button
                    type="button"
                    onClick={() => setUseNewCategory(false)}
                    className="px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg text-sm"
                  >
                    Existente
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción (opcional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900 bg-white resize-none"
              placeholder="Detalles adicionales..."
            />
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={`flex-1 px-4 py-2 text-white rounded-lg disabled:opacity-50 font-medium ${
                type === 'income' 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {isLoading ? 'Guardando...' : type === 'income' ? 'Registrar Ingreso' : 'Registrar Gasto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}