// src/renderer/components/reserve/TransferFromCashModal.tsx
import { useState, useEffect } from 'react';
import { X, ArrowRightLeft, AlertCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  categories: string[];
}

const COMMON_CATEGORIES = [
  'Alquiler',
  'Servicios',
  'Impuestos',
  'Insumos',
  'Mantenimiento',
  'Sueldos',
  'Ahorro',
  'Otros'
];

export function TransferFromCashModal({ isOpen, onClose, onSaved, categories }: Props) {
  const [formData, setFormData] = useState({
    amount: '',
    concept: '',
    category: '',
    newCategory: '',
  });
  const [cashRegister, setCashRegister] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCash, setIsLoadingCash] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useNewCategory, setUseNewCategory] = useState(false);

  const allCategories = [...new Set([...categories, ...COMMON_CATEGORIES])].sort();

  useEffect(() => {
    if (isOpen) {
      loadCashRegister();
      setFormData({
        amount: '',
        concept: '',
        category: allCategories[0] || '',
        newCategory: '',
      });
      setError(null);
      setUseNewCategory(false);
    }
  }, [isOpen]);

  async function loadCashRegister() {
    setIsLoadingCash(true);
    try {
      const register = await window.electronAPI.cash.getOpen();
      setCashRegister(register);
    } catch (error) {
      console.error('Error loading cash register:', error);
    } finally {
      setIsLoadingCash(false);
    }
  }

  if (!isOpen) return null;

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!cashRegister) {
      setError('No hay caja abierta');
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      setError('Ingresá un monto válido');
      return;
    }

    if (!formData.concept.trim()) {
      setError('El concepto es requerido');
      return;
    }

    setIsLoading(true);

    try {
      const category = useNewCategory ? formData.newCategory.trim() : formData.category;
      
      await window.electronAPI.reserve.transferFromCash({
        cashRegisterId: cashRegister.id,
        amount,
        concept: formData.concept.trim(),
        category: category || undefined,
      });

      onSaved();
    } catch (err: any) {
      console.error('Error transferring:', err);
      setError(err.message || 'Error al realizar la transferencia');
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-amber-50">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-amber-600" />
            Transferir a Reserva
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Estado de caja */}
        {isLoadingCash ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Verificando caja...</p>
          </div>
        ) : !cashRegister ? (
          <div className="p-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-800">No hay caja abierta</p>
                <p className="text-sm text-red-600 mt-1">
                  Debés abrir la caja diaria antes de transferir fondos a la reserva.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-full mt-4 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cerrar
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Info de caja */}
            <div className="bg-green-50 rounded-lg p-3 text-sm">
              <p className="text-green-700">
                ✅ Caja abierta #{cashRegister.id}
              </p>
            </div>

            {/* Monto */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Monto a transferir *
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
                Concepto / Destino *
              </label>
              <input
                type="text"
                value={formData.concept}
                onChange={(e) => handleChange('concept', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900 bg-white"
                placeholder="Ej: Reserva para alquiler, Fondo para insumos"
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

            {/* Info */}
            <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-700">
              💡 Esta transferencia se registrará como egreso en la caja diaria y como ingreso en la caja reserva.
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
                className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 font-medium"
              >
                {isLoading ? 'Transfiriendo...' : 'Transferir'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}