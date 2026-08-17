// src/renderer/components/inventory/ProductFormModal.tsx
import { useState, useEffect } from 'react';
import { X, Upload, Trash2, Image as ImageIcon } from 'lucide-react';
import type { Product } from '@/shared/types/electron';
import { packSizesFor, packPriceField, packLabel, ALL_PACK_SIZES } from '@/shared/packs';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  product: Product | null;
  categories: string[];
}

const UNITS = [
  { value: 'ud', label: 'Unidad' },
  { value: 'kg', label: 'Kilogramo' },
];

export function ProductFormModal({ isOpen, onClose, onSaved, product, categories }: Props) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    barcode: '',
    category: '',
    newCategory: '',
    price: '',
    pricePack3: '',
    pricePack4: '',
    pricePack5: '',
    pricePack10: '',
    cost: '',
    stock: '',
    stockMin: '',
    unit: 'ud' as 'ud' | 'kg',
    image: null as string | null,
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useNewCategory, setUseNewCategory] = useState(false);

  const isEditing = !!product;

  // Tamaños de pack que ofrece la categoría elegida (viandas y tartas x3/x5/x10,
  // hamburguesas x4). Se recalcula al cambiar de categoría.
  const currentCategory = useNewCategory ? formData.newCategory : formData.category;
  const packSizes = packSizesFor(currentCategory);

  useEffect(() => {
    if (isOpen) {
      if (product) {
        setFormData({
          name: product.name,
          description: product.description || '',
          barcode: product.barcode || '',
          category: product.category,
          newCategory: '',
          price: product.price.toString(),
          pricePack3: product.pricePack3?.toString() ?? '',
          pricePack4: product.pricePack4?.toString() ?? '',
          pricePack5: product.pricePack5?.toString() ?? '',
          pricePack10: product.pricePack10?.toString() ?? '',
          cost: product.cost?.toString() || '',
          stock: product.stock.toString(),
          stockMin: product.stockMin?.toString() || '',
          unit: product.unit,
          image: product.image || null,
        });
        setUseNewCategory(false);
        
        // Cargar preview de imagen existente
        if (product.image) {
          loadImagePreview(product.image);
        } else {
          setImagePreview(null);
        }
      } else {
        setFormData({
          name: '',
          description: '',
          barcode: '',
          category: categories[0] || '',
          newCategory: '',
          price: '',
          pricePack3: '',
          pricePack4: '',
          pricePack5: '',
          pricePack10: '',
          cost: '',
          stock: '0',
          stockMin: '0',
          unit: 'ud',
                      image: null,
        });
        setUseNewCategory(categories.length === 0);
        setImagePreview(null);
      }
      setError(null);
    }
  }, [isOpen, product, categories]);

  const loadImagePreview = async (imagePath: string) => {
    try {
      const base64 = await window.electronAPI.images.getBase64(imagePath);
      setImagePreview(base64);
    } catch (err) {
      console.error('Error loading image preview:', err);
      setImagePreview(null);
    }
  };

  if (!isOpen) return null;

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSelectImage = async () => {
    try {
      const selectedPath = await window.electronAPI.images.select();
      if (selectedPath) {
        // Guardar la imagen
        const savedPath = await window.electronAPI.images.save(selectedPath);
        setFormData(prev => ({ ...prev, image: savedPath }));
        
        // Cargar preview
        const base64 = await window.electronAPI.images.getBase64(savedPath);
        setImagePreview(base64);
      }
    } catch (err) {
      console.error('Error selecting image:', err);
      setError('Error al seleccionar la imagen');
    }
  };

  const handleRemoveImage = async () => {
    if (formData.image) {
      // Si es una imagen nueva (no del producto original), eliminarla
      if (!product?.image || formData.image !== product.image) {
        await window.electronAPI.images.delete(formData.image);
      }
    }
    setFormData(prev => ({ ...prev, image: null }));
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError('El nombre es requerido');
      return;
    }

    const category = useNewCategory ? formData.newCategory.trim() : formData.category;
    if (!category) {
      setError('La categoría es requerida');
      return;
    }

    const price = parseFloat(formData.price);
    if (isNaN(price) || price <= 0) {
      setError('El precio por unidad debe ser mayor a 0');
      return;
    }

    // Los precios de pack son opcionales: vacío significa que el producto no se
    // vende en ese pack. Pero si se carga un valor, tiene que ser válido.
    const packPrices: Record<string, number | null> = {};
    for (const size of ALL_PACK_SIZES) {
      const field = packPriceField(size);
      const raw = packSizes.includes(size) ? formData[field].trim() : '';

      if (raw === '') {
        packPrices[field] = null;
        continue;
      }

      const value = parseFloat(raw);
      if (isNaN(value) || value <= 0) {
        setError(`El precio del ${packLabel(size).toLowerCase()} debe ser mayor a 0`);
        return;
      }
      packPrices[field] = value;
    }

    setIsLoading(true);

    try {
      // Si estamos editando y cambiamos la imagen, eliminar la anterior
      if (isEditing && product.image && product.image !== formData.image) {
        await window.electronAPI.images.delete(product.image);
      }

      const data = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        barcode: formData.barcode.trim() || null,
        category,
        price,
        ...packPrices,
        cost: formData.cost ? parseFloat(formData.cost) : 0,
        stock: parseFloat(formData.stock) || 0,
        stockMin: parseFloat(formData.stockMin) || 0,
        unit: formData.unit,
        image: formData.image,
      };

      if (isEditing) {
        await window.electronAPI.products.update(product.id, data);
      } else {
        await window.electronAPI.products.create(data);
      }

      onSaved();
    } catch (err: any) {
      console.error('Error saving product:', err);
      setError(err.message || 'Error al guardar el producto');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {isEditing ? 'Editar Producto' : 'Nuevo Producto'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Imagen del producto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Imagen del producto
            </label>
            <div className="flex items-start gap-4">
              {/* Preview */}
              <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden flex items-center justify-center bg-gray-50">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ImageIcon className="w-10 h-10 text-gray-400" />
                )}
              </div>
              
              {/* Botones */}
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleSelectImage}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  {imagePreview ? 'Cambiar imagen' : 'Subir imagen'}
                </button>
                
                {imagePreview && (
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Quitar imagen
                  </button>
                )}
                
                <p className="text-xs text-gray-500 mt-1">
                  JPG, PNG, WebP o GIF. Máx 5MB.
                </p>
              </div>
            </div>
          </div>

          {/* Nombre y Código */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
                placeholder="Nombre del producto"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Código de barras
              </label>
              <input
                type="text"
                value={formData.barcode}
                onChange={(e) => handleChange('barcode', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 font-mono text-gray-900 bg-white"
                placeholder="Escanear o ingresar código"
              />
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none text-gray-900 bg-white"
              placeholder="Descripción opcional del producto"
            />
          </div>

          {/* Categoría */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categoría *
            </label>
            <div className="flex gap-2">
              {categories.length > 0 && !useNewCategory ? (
                <>
                  <select
                    value={formData.category}
                    onChange={(e) => handleChange('category', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setUseNewCategory(true)}
                    className="px-3 py-2 text-green-600 hover:bg-green-50 rounded-lg text-sm"
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
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
                    placeholder="Nueva categoría"
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

          {/* PRECIOS */}
          <div className="bg-blue-50 rounded-lg p-4 space-y-4">
            <h3 className="font-semibold text-blue-900">💰 Precios</h3>

            <div>
              <label className="block text-sm font-medium text-green-700 mb-1">
                Precio por unidad *
              </label>
              <div className="relative max-w-xs">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => handleChange('price', e.target.value)}
                  className="w-full pl-8 pr-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-blue-200">
              <div className="flex items-baseline justify-between mb-1">
                <h4 className="text-sm font-medium text-blue-900">Precios por pack</h4>
                <span className="text-xs text-blue-600">
                  Precio de cada unidad dentro del pack
                </span>
              </div>
              <p className="text-xs text-gray-600 mb-3">
                Dejá vacío el pack que este producto no venda. Si los dejás todos
                vacíos, el producto se vende únicamente por unidad.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {packSizes.map((size) => (
                  <div key={size}>
                    <label className="block text-sm font-medium text-blue-700 mb-1">
                      {packLabel(size)}
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData[packPriceField(size)]}
                        onChange={(e) => handleChange(packPriceField(size), e.target.value)}
                        className="w-full pl-8 pr-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                        placeholder="—"
                      />
                    </div>
                    {formData[packPriceField(size)] && formData.price && (
                      <p className="mt-1 text-xs text-gray-500">
                        Pack completo: ${(parseFloat(formData[packPriceField(size)]) * size).toFixed(2)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Costo y Unidad */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Costo
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.cost}
                  onChange={(e) => handleChange('cost', e.target.value)}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unidad
              </label>
              <select
                value={formData.unit}
                onChange={(e) => handleChange('unit', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
              >
                {UNITS.map(u => (
                  <option key={u.value} value={u.value}>{u.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Stock */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stock actual
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.stock}
                onChange={(e) => handleChange('stock', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stock mínimo
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.stockMin}
                onChange={(e) => handleChange('stockMin', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
                placeholder="0"
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
              className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
            >
              {isLoading ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Crear Producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}