// src/renderer/components/suppliers/SupplierFormModal.tsx
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Supplier } from '@/shared/types/electron';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  supplier: Supplier | null;
  categories: string[];
}

export function SupplierFormModal({ isOpen, onClose, onSaved, supplier, categories }: Props) {
  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    phone: '',
    email: '',
    category: '',
    newCategory: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useNewCategory, setUseNewCategory] = useState(false);

  const isEditing = !!supplier;

  useEffect(() => {
    if (isOpen) {
      if (supplier) {
        setFormData({
          companyName: supplier.companyName,
          contactName: supplier.contactName || '',
          phone: supplier.phone || '',
          email: supplier.email || '',
          category: supplier.category || '',
          newCategory: '',
        });
        setUseNewCategory(false);
      } else {
        setFormData({
          companyName: '',
          contactName: '',
          phone: '',
          email: '',
          category: categories[0] || '',
          newCategory: '',
        });
        setUseNewCategory(categories.length === 0);
      }
      setError(null);
    }
  }, [isOpen, supplier, categories]);

  if (!isOpen) return null;

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.companyName.trim()) {
      setError('El nombre de la empresa es requerido');
      return;
    }

    setIsLoading(true);

    try {
      const category = useNewCategory ? formData.newCategory.trim() : formData.category;
      
      const data = {
        companyName: formData.companyName.trim(),
        contactName: formData.contactName.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        email: formData.email.trim() || undefined,
        category: category || undefined,
      };

      if (isEditing) {
        await window.electronAPI.suppliers.update(supplier.id, data);
      } else {
        await window.electronAPI.suppliers.create(data);
      }

      onSaved();
    } catch (err: any) {
      console.error('Error saving supplier:', err);
      setError(err.message || 'Error al guardar el proveedor');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {isEditing ? 'Editar Proveedor' : 'Nuevo Proveedor'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Nombre empresa */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre de la empresa *
            </label>
            <input
              type="text"
              value={formData.companyName}
              onChange={(e) => handleChange('companyName', e.target.value)}
              className="w-full px-3 py-2 border text-gray-800 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="Ej: Distribuidora ABC"
              autoFocus
            />
          </div>

          {/* Nombre contacto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del contacto
            </label>
            <input
              type="text"
              value={formData.contactName}
              onChange={(e) => handleChange('contactName', e.target.value)}
              className="w-full px-3 py-2 border text-gray-800 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="Ej: Juan Pérez"
            />
          </div>

          {/* Categoría */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categoría / Rubro
            </label>
            <div className="flex gap-2">
              {categories.length > 0 && !useNewCategory ? (
                <>
                  <select
                    value={formData.category}
                    onChange={(e) => handleChange('category', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="">Sin categoría</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setUseNewCategory(true)}
                    className="px-3 py-2 text-purple-600 hover:bg-purple-50 rounded-lg text-sm"
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
                    className="flex-1 px-3 py-2 border text-gray-800 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    placeholder="Ej: Frutas y Verduras"
                  />
                  {categories.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setUseNewCategory(false)}
                      className="px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg text-sm"
                    >
                      Existente
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Teléfono y Email */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="w-full px-3 py-2 border text-gray-800 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="+54 11 1234-5678"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="w-full px-3 py-2 border text-gray-800 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="proveedor@email.com"
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 font-medium"
            >
              {isLoading ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Crear Proveedor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}