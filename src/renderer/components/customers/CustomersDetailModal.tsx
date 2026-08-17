// src/renderer/components/customers/CustomerDetailModal.tsx
import { useState, useEffect } from 'react';
import { X, ShoppingBag, DollarSign, Calendar, Briefcase, Phone, Mail, Cake } from 'lucide-react';
import type { Customer, CustomerStats, CustomerPurchase } from '@/shared/types/electron';
import { SaleDetailModal } from '../sales/SalesDetailModal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
}

export function CustomerDetailModal({ isOpen, onClose, customer }: Props) {
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [purchases, setPurchases] = useState<CustomerPurchase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSaleId, setSelectedSaleId] = useState<number | null>(null);
  const [showSaleDetail, setShowSaleDetail] = useState(false);

  useEffect(() => {
    if (isOpen && customer) {
      loadData();
    }
  }, [isOpen, customer]);

  async function loadData() {
    if (!customer) return;
    
    setIsLoading(true);
    try {
      const [statsData, purchasesData] = await Promise.all([
        window.electronAPI.customers.getStats(customer.id),
        window.electronAPI.customers.getPurchaseHistory(customer.id),
      ]);
      setStats(statsData);
      setPurchases(purchasesData);
    } catch (error) {
      console.error('Error loading customer data:', error);
    } finally {
      setIsLoading(false);
    }
  }

  if (!isOpen || !customer) return null;

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
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
    const labels: Record<string, string> = {
      cash: 'Efectivo',
      transfer: 'Transferencia',
    };
    return labels[method] || method;
  };

  const handlePurchaseClick = (purchaseId: number) => {
    setSelectedSaleId(purchaseId);
    setShowSaleDetail(true);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-brand-dark text-white">
            <div>
              <h2 className="text-xl font-bold">{customer.fullName}</h2>
              {customer.occupation && (
                <p className="text-blue-100 flex items-center gap-1 mt-1">
                  <Briefcase className="w-4 h-4" />
                  {customer.occupation}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Info de contacto */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {customer.phone && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span>{customer.phone}</span>
                </div>
              )}
              {customer.email && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="truncate">{customer.email}</span>
                </div>
              )}
              {customer.birthDate && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Cake className="w-4 h-4 text-gray-400" />
                  <span>{formatDate(new Date(customer.birthDate))}</span>
                </div>
              )}
            </div>

            {/* Estadísticas */}
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <ShoppingBag className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-blue-700">{stats?.totalPurchases || 0}</p>
                    <p className="text-sm text-blue-600">Compras</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <DollarSign className="w-6 h-6 text-green-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-green-700">{formatMoney(stats?.totalSpent || 0)}</p>
                    <p className="text-sm text-green-600">Total gastado</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4 text-center">
                    <Calendar className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                    <p className="text-lg font-bold text-purple-700">
                      {stats?.lastPurchase ? formatDate(stats.lastPurchase) : '-'}
                    </p>
                    <p className="text-sm text-purple-600">Última compra</p>
                  </div>
                </div>

                {/* Historial de compras */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Historial de Compras</h3>
                  
                  {purchases.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <ShoppingBag className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Sin compras registradas</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {purchases.map((purchase) => (
                        <div
                          key={purchase.id}
                          onClick={() => handlePurchaseClick(purchase.id)}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 hover:ring-2 hover:ring-blue-300 transition-all"
                        >
                          <div>
                            <p className="font-medium text-gray-800">
                              Venta #{purchase.id}
                              <span className="ml-2 text-xs text-blue-600">(ver detalle)</span>
                            </p>
                            <p className="text-sm text-gray-500">
                              {formatDateTime(purchase.createdAt)} • {purchase.itemsCount} productos
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">{formatMoney(purchase.total)}</p>
                            <p className="text-sm text-gray-500">
                              {getPaymentMethodLabel(purchase.paymentMethod)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
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

      {/* Modal detalle de venta */}
      <SaleDetailModal
        isOpen={showSaleDetail}
        onClose={() => setShowSaleDetail(false)}
        saleId={selectedSaleId}
      />
    </>
  );
}