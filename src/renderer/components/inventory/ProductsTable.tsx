// src/renderer/components/inventory/ProductsTable.tsx
import { Pencil, Trash2, AlertTriangle } from 'lucide-react';
import type { Product } from '@/shared/types/electron';

interface Props {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}

export function ProductsTable({ products, onEdit, onDelete }: Props) {
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(amount);
  };

  return (
    <div className="bg-white rounded-xl shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Producto
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Categoría
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Código
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Precio
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Costo
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Stock
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {products.map((product) => {
              const isLowStock = product.stock <= (product.stockMin || 0);
              const margin = product.cost 
                ? ((product.price - product.cost) / product.price * 100).toFixed(0)
                : null;

              return (
                <tr 
                  key={product.id} 
                  className={`hover:bg-gray-50 transition-colors ${isLowStock ? 'bg-red-50' : ''}`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {product.isFavorite && (
                        <span className="text-yellow-500" title="Favorito">⭐</span>
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{product.name}</p>
                        {product.description && (
                          <p className="text-sm text-gray-500 truncate max-w-[200px]">
                            {product.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                      {product.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 font-mono">
                    {product.barcode || '-'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-semibold text-gray-900">
                      {formatMoney(product.price)}
                    </span>
                    {margin && (
                      <span className="block text-xs text-green-600">
                        {margin}% margen
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600">
                    {product.cost ? formatMoney(product.cost) : '-'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {isLowStock && (
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                      )}
                      <span className={`font-semibold ${isLowStock ? 'text-red-600' : 'text-gray-900'}`}>
                        {product.stock}
                      </span>
                      <span className="text-gray-400 text-sm">{product.unit}</span>
                    </div>
                    {product.stockMin !== null && product.stockMin > 0 && (
                      <span className="text-xs text-gray-400">
                        Mín: {product.stockMin}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => onEdit(product)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(product)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}