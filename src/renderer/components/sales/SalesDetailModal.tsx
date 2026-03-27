// src/renderer/components/sales/SaleDetailModal.tsx
import { useState, useEffect } from 'react';
import { X, ShoppingBag, User, CreditCard, Calendar, Package } from 'lucide-react';
import type { Sale } from '@/shared/types/electron';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  saleId: number | null;
}

export function SaleDetailModal({ isOpen, onClose, saleId }: Props) {
  const [sale, setSale] = useState<Sale | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen && saleId) {
      loadSale();
    }
  }, [isOpen, saleId]);

  async function loadSale() {
    if (!saleId) return;
    
    setIsLoading(true);
    try {
      const data = await window.electronAPI.sales.getById(saleId);
      setSale(data);
    } catch (error) {
      console.error('Error loading sale:', error);
    } finally {
      setIsLoading(false);
    }
  }

  if (!isOpen) return null;

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(amount);
  };

  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, { label: string; color: string }> = {
      cash: { label: 'Efectivo', color: 'bg-green-100 text-green-700' },
      debit: { label: 'Débito', color: 'bg-blue-100 text-blue-700' },
      credit: { label: 'Crédito', color: 'bg-purple-100 text-purple-700' },
      transfer: { label: 'Transferencia', color: 'bg-orange-100 text-orange-700' },
      mixed: { label: 'Pago dividido', color: 'bg-gray-100 text-gray-700' },
    };
    return labels[method] || { label: method, color: 'bg-gray-100 text-gray-700' };
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-green-500 to-green-600 text-white">
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-6 h-6" />
            <div>
              <h2 className="text-xl font-bold">Venta #{saleId}</h2>
              {sale && (
                <p className="text-green-100 text-sm flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDateTime(sale.createdAt)}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
          ) : sale ? (
            <div className="space-y-6">
              {/* Info general */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-gray-400" />
                  <span className={`px-2 py-1 rounded-full text-sm font-medium ${getPaymentMethodLabel(sale.paymentMethod).color}`}>
                    {getPaymentMethodLabel(sale.paymentMethod).label}
                  </span>
                </div>
                {sale.customerId && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <User className="w-4 h-4" />
                    <span className="text-sm">Cliente asignado</span>
                  </div>
                )}
              </div>

              {/* Productos */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Productos ({sale.items?.length || 0})
                </h3>
                <div className="bg-gray-50 rounded-lg divide-y divide-gray-200">
                  {sale.items && sale.items.length > 0 ? (
                    sale.items.map((item) => (
                      <div key={item.id} className="p-3 flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{item.productName}</p>
                          <p className="text-sm text-gray-500">
                            {item.quantity} x {formatMoney(item.price)}
                          </p>
                        </div>
                        <span className="font-semibold text-gray-900">
                          {formatMoney(item.subtotal)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-gray-400">
                      Sin detalle de productos
                    </div>
                  )}
                </div>
              </div>

              {/* Totales */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                {/* Desglose de pagos (si aplica) */}
                {sale.payments && sale.payments.length > 0 && (
                  <div className="pb-3 border-b border-gray-200 space-y-2">
                    <p className="text-sm font-semibold text-gray-700">Pagos</p>
                    <div className="space-y-1">
                      {sale.payments.map((p) => (
                        <div key={p.id} className="flex justify-between text-sm">
                          <span className="text-gray-600">
                            {getPaymentMethodLabel(p.paymentMethod).label}
                          </span>
                          <span className="font-medium text-gray-900">{formatMoney(p.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">{formatMoney(sale.subtotal)}</span>
                </div>
                {sale.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Descuento</span>
                    <span className="font-medium text-red-600">-{formatMoney(sale.discount)}</span>
                  </div>
                )}
                
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
                  <span>Total</span>
                  <span className="text-green-600">{formatMoney(sale.total)}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              No se encontró la venta
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}