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
    <div className="bg-card rounded-xl shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-secondary border-b border-border">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Producto
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Categoría
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Código
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Precio
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Costo
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Stock
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {products.map((product) => {
              const isLowStock = product.stock <= (product.stockMin || 0);
              const margin = product.cost 
                ? ((product.price - product.cost) / product.price * 100).toFixed(0)
                : null;

              return (
                <tr 
                  key={product.id} 
                  className={`hover:bg-accent transition-colors ${isLowStock ? 'bg-destructive/10' : ''}`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-medium text-foreground">{product.name}</p>
                        {product.description && (
                          <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                            {product.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-secondary text-foreground text-sm rounded-full">
                      {product.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground font-mono">
                    {product.barcode || '-'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-semibold text-foreground">
                      {formatMoney(product.price)}
                    </span>
                    {margin && (
                      <span className="block text-xs text-brand-green-ink">
                        {margin}% margen
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {product.cost ? formatMoney(product.cost) : '-'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {isLowStock && (
                        <AlertTriangle className="w-4 h-4 text-destructive" />
                      )}
                      <span className={`font-semibold ${isLowStock ? 'text-destructive' : 'text-foreground'}`}>
                        {product.stock}
                      </span>
                      <span className="text-muted-foreground text-sm">{product.unit}</span>
                    </div>
                    {product.stockMin !== null && product.stockMin > 0 && (
                      <span className="text-xs text-muted-foreground">
                        Mín: {product.stockMin}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => onEdit(product)}
                        className="p-2 text-brand-orange-ink hover:bg-brand-orange/10 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(product)}
                        className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
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