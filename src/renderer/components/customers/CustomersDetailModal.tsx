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
        <div className="bg-card rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border bg-brand-dark text-white">
            <div>
              <h2 className="text-xl font-bold">{customer.fullName}</h2>
              {customer.occupation && (
                <p className="text-white/80 flex items-center gap-1 mt-1">
                  <Briefcase className="w-4 h-4" />
                  {customer.occupation}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-card/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Info de contacto */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {customer.phone && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span>{customer.phone}</span>
                </div>
              )}
              {customer.email && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="truncate">{customer.email}</span>
                </div>
              )}
              {customer.birthDate && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Cake className="w-4 h-4 text-muted-foreground" />
                  <span>{formatDate(new Date(customer.birthDate))}</span>
                </div>
              )}
            </div>

            {/* Estadísticas */}
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-orange"></div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-brand-orange/10 rounded-lg p-4 text-center">
                    <ShoppingBag className="w-6 h-6 text-brand-orange-ink mx-auto mb-2" />
                    <p className="text-2xl font-bold text-brand-orange-ink">{stats?.totalPurchases || 0}</p>
                    <p className="text-sm text-brand-orange-ink">Compras</p>
                  </div>
                  <div className="bg-brand-green/10 rounded-lg p-4 text-center">
                    <DollarSign className="w-6 h-6 text-brand-green-ink mx-auto mb-2" />
                    <p className="text-2xl font-bold text-brand-green-ink">{formatMoney(stats?.totalSpent || 0)}</p>
                    <p className="text-sm text-brand-green-ink">Total gastado</p>
                  </div>
                  <div className="bg-brand-yellow/15 rounded-lg p-4 text-center">
                    <Calendar className="w-6 h-6 text-brand-dark mx-auto mb-2" />
                    <p className="text-lg font-bold text-brand-dark">
                      {stats?.lastPurchase ? formatDate(stats.lastPurchase) : '-'}
                    </p>
                    <p className="text-sm text-brand-dark">Última compra</p>
                  </div>
                </div>

                {/* Historial de compras */}
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-3">Historial de Compras</h3>
                  
                  {purchases.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <ShoppingBag className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Sin compras registradas</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {purchases.map((purchase) => (
                        <div
                          key={purchase.id}
                          onClick={() => handlePurchaseClick(purchase.id)}
                          className="flex items-center justify-between p-3 bg-secondary rounded-lg cursor-pointer hover:bg-accent hover:ring-2 hover:ring-brand-orange/40 transition-all"
                        >
                          <div>
                            <p className="font-medium text-foreground">
                              Venta #{purchase.id}
                              <span className="ml-2 text-xs text-brand-orange-ink">(ver detalle)</span>
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {formatDateTime(purchase.createdAt)} • {purchase.itemsCount} productos
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-foreground">{formatMoney(purchase.total)}</p>
                            <p className="text-sm text-muted-foreground">
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
          <div className="p-4 border-t border-border">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-secondary text-foreground rounded-lg hover:bg-secondary"
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