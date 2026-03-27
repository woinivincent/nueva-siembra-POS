// src/renderer/pages/Dashboard.tsx
import { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  ShoppingCart, 
  DollarSign, 
  Package,
  AlertTriangle,
  Cake,
  CreditCard,
  Banknote,
  Wallet,
  RefreshCw,
  MessageCircle
} from 'lucide-react';

interface DashboardStats {
  todaySales: number;
  todayTransactions: number;
  todayAvgTicket: number;
  yesterdaySales: number;
  salesGrowth: number;
  todayByPayment: {
    cash: number;
    debit: number;
    credit: number;
    transfer: number;
  };
  topProducts: {
    id: number;
    name: string;
    quantity: number;
    total: number;
  }[];
  lowStockProducts: {
    id: number;
    name: string;
    stock: number;
    stockMin: number;
  }[];
  cashRegister: {
    isOpen: boolean;
    openingAmount: number;
    currentAmount: number;
    salesCount: number;
  } | null;
  todayBirthdays: {
    id: number;
    fullName: string;
    phone: string | null;
  }[];
  monthSales: number;
  monthTransactions: number;
}

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 60000);
    return () => clearInterval(interval);
  }, []);

  async function loadStats() {
    try {
      const data = await window.electronAPI.dashboard.getStats();
      setStats(data);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(amount);
  };

  const openWhatsApp = (phone: string, name: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const message = encodeURIComponent(`¡Feliz cumpleaños ${name.split(' ')[0]}! 🎂🎉`);
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-6">
        <p className="text-red-500">Error al cargar el dashboard</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">📊 Dashboard</h1>
          <p className="text-gray-500">
            Resumen del día • Actualizado {lastUpdate.toLocaleTimeString('es-AR')}
          </p>
        </div>
        <button
          onClick={loadStats}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
          title="Actualizar"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Alerta de cumpleaños */}
      {stats.todayBirthdays.length > 0 && (
        <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-xl shadow-lg p-4 text-white">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 rounded-full p-2">
              <Cake className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold">🎂 ¡Cumpleaños Hoy!</h3>
              <div className="flex flex-wrap gap-2 mt-2">
                {stats.todayBirthdays.map(customer => (
                  <div key={customer.id} className="bg-white/20 rounded-lg px-3 py-1 flex items-center gap-2">
                    <span>{customer.fullName}</span>
                    {customer.phone && (
                      <button
                        onClick={() => openWhatsApp(customer.phone!, customer.fullName)}
                        className="bg-green-500 hover:bg-green-600 rounded px-2 py-0.5 text-xs flex items-center gap-1"
                      >
                        <MessageCircle className="w-3 h-3" /> Saludar
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KPIs principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Ventas del día */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Ventas Hoy</p>
              <p className="text-2xl font-bold text-gray-900">{formatMoney(stats.todaySales)}</p>
              <div className={`flex items-center gap-1 text-sm mt-1 ${
                stats.salesGrowth >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {stats.salesGrowth >= 0 ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                <span>{stats.salesGrowth.toFixed(1)}% vs ayer</span>
              </div>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Transacciones */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Transacciones</p>
              <p className="text-2xl font-bold text-gray-900">{stats.todayTransactions}</p>
              <p className="text-sm text-gray-400 mt-1">
                Ticket prom: {formatMoney(stats.todayAvgTicket)}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <ShoppingCart className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Ventas del mes */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Ventas del Mes</p>
              <p className="text-2xl font-bold text-gray-900">{formatMoney(stats.monthSales)}</p>
              <p className="text-sm text-gray-400 mt-1">
                {stats.monthTransactions} transacciones
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Estado de caja */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Caja</p>
              {stats.cashRegister ? (
                <>
                  <p className="text-2xl font-bold text-green-600">{formatMoney(stats.cashRegister.currentAmount)}</p>
                  <p className="text-sm text-gray-400 mt-1">
                    {stats.cashRegister.salesCount} ventas
                  </p>
                </>
              ) : (
                <>
                  <p className="text-lg font-bold text-gray-400">Cerrada</p>
                  <p className="text-sm text-gray-400 mt-1">Sin caja abierta</p>
                </>
              )}
            </div>
            <div className={`p-3 rounded-lg ${stats.cashRegister ? 'bg-green-100' : 'bg-gray-100'}`}>
              <Wallet className={`w-6 h-6 ${stats.cashRegister ? 'text-green-600' : 'text-gray-400'}`} />
            </div>
          </div>
        </div>
      </div>

      {/* Segunda fila */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ventas por método de pago */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Ventas por Método de Pago
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Banknote className="w-4 h-4 text-green-600" />
                <span className="text-gray-600">Efectivo</span>
              </div>
              <span className="font-semibold  text-green-600">{formatMoney(stats.todayByPayment.cash)}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-blue-600" />
                <span className="text-gray-600">Débito</span>
              </div>
              <span className="font-semibold  text-green-600">{formatMoney(stats.todayByPayment.debit)}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-purple-600" />
                <span className="text-gray-600">Crédito</span>
              </div>
              <span className="font-semibold  text-green-600">{formatMoney(stats.todayByPayment.credit)}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-orange-600" />
                <span className="text-gray-600">Transferencia</span>
              </div>
              <span className="font-semibold  text-green-600">{formatMoney(stats.todayByPayment.transfer)}</span>
            </div>
          </div>
          
          {/* Barra visual */}
          {stats.todaySales > 0 && (
            <div className="mt-4 h-3 rounded-full overflow-hidden flex bg-gray-100">
              {stats.todayByPayment.cash > 0 && (
                <div 
                  className="bg-green-500" 
                  style={{ width: `${(stats.todayByPayment.cash / stats.todaySales) * 100}%` }}
                  title={`Efectivo: ${formatMoney(stats.todayByPayment.cash)}`}
                />
              )}
              {stats.todayByPayment.debit > 0 && (
                <div 
                  className="bg-blue-500" 
                  style={{ width: `${(stats.todayByPayment.debit / stats.todaySales) * 100}%` }}
                  title={`Débito: ${formatMoney(stats.todayByPayment.debit)}`}
                />
              )}
              {stats.todayByPayment.credit > 0 && (
                <div 
                  className="bg-purple-500" 
                  style={{ width: `${(stats.todayByPayment.credit / stats.todaySales) * 100}%` }}
                  title={`Crédito: ${formatMoney(stats.todayByPayment.credit)}`}
                />
              )}
              {stats.todayByPayment.transfer > 0 && (
                <div 
                  className="bg-orange-500" 
                  style={{ width: `${(stats.todayByPayment.transfer / stats.todaySales) * 100}%` }}
                  title={`Transferencia: ${formatMoney(stats.todayByPayment.transfer)}`}
                />
              )}
            </div>
          )}
        </div>

        {/* Productos más vendidos */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Package className="w-5 h-5" />
            Top Productos Hoy
          </h3>
          {stats.topProducts.length === 0 ? (
            <p className="text-gray-400 text-center py-4">Sin ventas hoy</p>
          ) : (
            <div className="space-y-3">
              {stats.topProducts.map((product, index) => (
                <div key={product.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      index === 0 ? 'bg-yellow-100 text-yellow-700' :
                      index === 1 ? 'bg-gray-100 text-gray-700' :
                      index === 2 ? 'bg-orange-100 text-orange-700' :
                      'bg-gray-50 text-gray-500'
                    }`}>
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium text-gray-800 text-sm">{product.name}</p>
                      <p className="text-xs text-gray-400">{product.quantity} vendidos</p>
                    </div>
                  </div>
                  <span className="font-semibold text-green-600 text-sm">{formatMoney(product.total)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stock bajo */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            Stock Bajo
            {stats.lowStockProducts.length > 0 && (
              <span className="ml-auto bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full">
                {stats.lowStockProducts.length}
              </span>
            )}
          </h3>
          {stats.lowStockProducts.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-green-600">✓ Stock OK</p>
              <p className="text-gray-400 text-sm">Sin alertas de stock</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {stats.lowStockProducts.map(product => (
                <div key={product.id} className="flex items-center justify-between bg-orange-50 rounded-lg p-2">
                  <span className="text-sm font-medium text-gray-800">{product.name}</span>
                  <span className="text-sm text-orange-600 font-semibold">
                    {product.stock} / {product.stockMin}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}