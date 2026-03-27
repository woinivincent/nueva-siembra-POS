// src/renderer/pages/Reports.tsx
import { useState } from 'react';
import { Calendar, Download, TrendingUp, ShoppingCart, DollarSign, CreditCard } from 'lucide-react';
import type { SalesReportSummary } from '@/shared/types/electron';

export function Reports() {
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(1); // Primer día del mes
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [report, setReport] = useState<SalesReportSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  async function loadReport() {
    setIsLoading(true);
    try {
      const data = await window.electronAPI.reports.getSalesReport(startDate, endDate);
      setReport(data);
    } catch (error) {
      console.error('Error loading report:', error);
      alert('Error al cargar el reporte');
    } finally {
      setIsLoading(false);
    }
  }

async function handleExport() {
  setIsExporting(true);
  try {
    const filePath = await window.electronAPI.reports.exportExcel(startDate, endDate);
    alert(`✅ Excel guardado en:\n${filePath}`);
  } catch (error) {
    console.error('Error exporting:', error);
    alert('Error al exportar');
  } finally {
    setIsExporting(false);
  }
}
  
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(amount);
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      cash: 'Efectivo',
      debit: 'Débito',
      credit: 'Crédito',
      transfer: 'Transferencia',
    };
    return labels[method] || method;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold  text-white">Reportes</h1>
          <p className="text-gray-500">Análisis de ventas por período</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Desde
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="pl-10 pr-4 py-2 border  text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hasta
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="pl-10 pr-4 py-2 border  text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <button
            onClick={loadReport}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            <TrendingUp className="w-4 h-4" />
            {isLoading ? 'Cargando...' : 'Generar Reporte'}
          </button>
          {report && (
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              {isExporting ? 'Exportando...' : 'Exportar CSV'}
            </button>
          )}
        </div>
      </div>

      {/* Resultados */}
      {report && (
        <div className="space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Ventas</p>
                  <p className="text-2xl font-bold text-gray-900">{formatMoney(report.totalSales)}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <ShoppingCart className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Transacciones</p>
                  <p className="text-2xl font-bold text-gray-900">{report.totalTransactions}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Ticket Promedio</p>
                  <p className="text-2xl font-bold text-gray-900">{formatMoney(report.avgTicket)}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <CreditCard className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Efectivo</p>
                  <p className="text-2xl font-bold text-gray-900">{formatMoney(report.byPaymentMethod.cash)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Por método de pago */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Por Método de Pago</h3>
              <div className="space-y-3">
                {Object.entries(report.byPaymentMethod).map(([method, amount]) => {
                  const percentage = report.totalSales > 0 ? (amount / report.totalSales) * 100 : 0;
                  return (
                    <div key={method}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">{getPaymentMethodLabel(method)}</span>
                        <span className="font-medium  text-green-600">{formatMoney(amount)}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full  bg-blue-500 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Productos más vendidos */}
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Productos Más Vendidos</h3>
              {report.topProducts.length === 0 ? (
                <p className="text-gray-400 text-center py-4">Sin datos</p>
              ) : (
                <div className="space-y-3">
                  {report.topProducts.slice(0, 5).map((product, index) => (
                    <div key={product.productId} className="flex items-center justify-between">
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
                          <p className="font-medium text-gray-900">{product.productName}</p>
                          <p className="text-xs text-gray-500">{product.quantitySold} vendidos</p>
                        </div>
                      </div>
                      <span className="font-semibold text-green-600">{formatMoney(product.totalRevenue)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Ventas por día */}
          {report.dailyData.length > 0 && (
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Ventas por Día</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Fecha</th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">Ventas</th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">Trans.</th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">Ticket Prom.</th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">Efectivo</th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">Electrónico</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {report.dailyData.map((day) => (
                      <tr key={day.date} className="hover:bg-gray-50">
                        <td className="px-4 py-2 font-medium text-black">{day.date}</td>
                        <td className="px-4 py-2 text-right text-green-600 font-semibold">{formatMoney(day.totalSales)}</td>
                        <td className="px-4 py-2 text-right text-black">{day.totalTransactions}</td>
                        <td className="px-4 py-2 text-right text-green-600">{formatMoney(day.avgTicket)}</td>
                        <td className="px-4 py-2 text-right  text-green-600">{formatMoney(day.cash)}</td>
                        <td className="px-4 py-2 text-right  text-green-600">{formatMoney(day.debit + day.credit + day.transfer)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {!report && !isLoading && (
        <div className="bg-white rounded-xl shadow p-12 text-center">
          <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">Generá un reporte</h3>
          <p className="text-gray-500">Seleccioná un rango de fechas y hacé clic en "Generar Reporte"</p>
        </div>
      )}
    </div>
  );
}