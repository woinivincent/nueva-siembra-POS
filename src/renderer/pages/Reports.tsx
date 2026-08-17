// src/renderer/pages/Reports.tsx
import { useState } from 'react';
import { Calendar, Download, TrendingUp, ShoppingCart, DollarSign, CreditCard, ArrowDownCircle, Briefcase, Users } from 'lucide-react';
import type { SalesReportSummary, ExpensesSummary } from '@/shared/types/electron';

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
  const [expensesReport, setExpensesReport] = useState<ExpensesSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  async function loadReport() {
    setIsLoading(true);
    try {
      const [salesData, expensesData] = await Promise.all([
        window.electronAPI.reports.getSalesReport(startDate, endDate),
        window.electronAPI.reports.getExpensesReport(startDate, endDate),
      ]);
      setReport(salesData);
      setExpensesReport(expensesData);
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
      transfer: 'Transferencia',
    };
    return labels[method] || method;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold  text-foreground">Reportes</h1>
          <p className="text-muted-foreground">Análisis de ventas por período</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-card rounded-xl shadow p-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Desde
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="pl-10 pr-4 py-2 border  text-black border-input rounded-lg focus:ring-2 focus:ring-brand-orange"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Hasta
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="pl-10 pr-4 py-2 border  text-black border-input rounded-lg focus:ring-2 focus:ring-brand-orange"
              />
            </div>
          </div>
          <button
            onClick={loadReport}
            disabled={isLoading}
            className="px-4 py-2 bg-brand-orange text-white rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
          >
            <TrendingUp className="w-4 h-4" />
            {isLoading ? 'Cargando...' : 'Generar Reporte'}
          </button>
          {report && (
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
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
            <div className="bg-card rounded-xl shadow p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-brand-green/25 rounded-lg">
                  <DollarSign className="w-6 h-6 text-brand-green-ink" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Ventas</p>
                  <p className="text-2xl font-bold text-foreground">{formatMoney(report.totalSales)}</p>
                </div>
              </div>
            </div>
            <div className="bg-card rounded-xl shadow p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-brand-orange/20 rounded-lg">
                  <ShoppingCart className="w-6 h-6 text-brand-orange-ink" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Transacciones</p>
                  <p className="text-2xl font-bold text-foreground">{report.totalTransactions}</p>
                </div>
              </div>
            </div>
            <div className="bg-card rounded-xl shadow p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-brand-yellow/30 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-brand-dark" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ticket Promedio</p>
                  <p className="text-2xl font-bold text-foreground">{formatMoney(report.avgTicket)}</p>
                </div>
              </div>
            </div>
            <div className="bg-card rounded-xl shadow p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-brand-orange/20 rounded-lg">
                  <CreditCard className="w-6 h-6 text-brand-orange-ink" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Efectivo</p>
                  <p className="text-2xl font-bold text-foreground">{formatMoney(report.byPaymentMethod.cash)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Por método de pago */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card rounded-xl shadow p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Por Método de Pago</h3>
              <div className="space-y-3">
                {Object.entries(report.byPaymentMethod).map(([method, amount]) => {
                  const percentage = report.totalSales > 0 ? (amount / report.totalSales) * 100 : 0;
                  return (
                    <div key={method}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">{getPaymentMethodLabel(method)}</span>
                        <span className="font-medium  text-brand-green-ink">{formatMoney(amount)}</span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div 
                          className="h-full  bg-brand-orange rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Productos más vendidos */}
            <div className="bg-card rounded-xl shadow p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Productos Más Vendidos</h3>
              {report.topProducts.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">Sin datos</p>
              ) : (
                <div className="space-y-3">
                  {report.topProducts.slice(0, 5).map((product, index) => (
                    <div key={product.productId} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          index === 0 ? 'bg-brand-yellow/30 text-brand-dark' :
                          index === 1 ? 'bg-secondary text-foreground' :
                          index === 2 ? 'bg-brand-orange/20 text-brand-orange-ink' :
                          'bg-secondary text-muted-foreground'
                        }`}>
                          {index + 1}
                        </span>
                        <div>
                          <p className="font-medium text-foreground">{product.productName}</p>
                          <p className="text-xs text-muted-foreground">{product.quantitySold} vendidos</p>
                        </div>
                      </div>
                      <span className="font-semibold text-brand-green-ink">{formatMoney(product.totalRevenue)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Ventas por día */}
          {report.dailyData.length > 0 && (
            <div className="bg-card rounded-xl shadow p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Ventas por Día</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-secondary">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground">Fecha</th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-muted-foreground">Ventas</th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-muted-foreground">Trans.</th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-muted-foreground">Ticket Prom.</th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-muted-foreground">Efectivo</th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-muted-foreground">Electrónico</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {report.dailyData.map((day) => (
                      <tr key={day.date} className="hover:bg-accent">
                        <td className="px-4 py-2 font-medium text-black">{day.date}</td>
                        <td className="px-4 py-2 text-right text-brand-green-ink font-semibold">{formatMoney(day.totalSales)}</td>
                        <td className="px-4 py-2 text-right text-black">{day.totalTransactions}</td>
                        <td className="px-4 py-2 text-right text-brand-green-ink">{formatMoney(day.avgTicket)}</td>
                        <td className="px-4 py-2 text-right  text-brand-green-ink">{formatMoney(day.cash)}</td>
                        <td className="px-4 py-2 text-right  text-brand-green-ink">{formatMoney(day.transfer)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Egresos, separados entre negocio y sueldo */}
      {expensesReport && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-card rounded-xl shadow p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-destructive/15 rounded-lg">
                  <ArrowDownCircle className="w-6 h-6 text-destructive" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Egresos</p>
                  <p className="text-2xl font-bold text-destructive">
                    {formatMoney(expensesReport.total)}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-card rounded-xl shadow p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-brand-orange/20 rounded-lg">
                  <Briefcase className="w-6 h-6 text-brand-orange-ink" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Egresos de Negocio</p>
                  <p className="text-2xl font-bold text-brand-orange-ink">
                    {formatMoney(expensesReport.business)}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-card rounded-xl shadow p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-brand-yellow/30 rounded-lg">
                  <Users className="w-6 h-6 text-brand-dark" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Egresos de Sueldo</p>
                  <p className="text-2xl font-bold text-brand-dark">
                    {formatMoney(expensesReport.salary)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Una tabla por tipo, para que se vea bien claro */}
          {([
            { type: 'business', label: 'Egresos de Negocio', total: expensesReport.business, accent: 'text-brand-orange-ink', icon: Briefcase },
            { type: 'salary', label: 'Egresos de Sueldo', total: expensesReport.salary, accent: 'text-brand-dark', icon: Users },
          ] as const).map((group) => {
            const rows = expensesReport.expenses.filter((e) => e.type === group.type);
            if (rows.length === 0) return null;
            const Icon = group.icon;

            return (
              <div key={group.type} className="bg-card rounded-xl shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Icon className={`w-5 h-5 ${group.accent}`} />
                    {group.label}
                  </h3>
                  <span className={`font-bold ${group.accent}`}>{formatMoney(group.total)}</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-secondary">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground">Fecha</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground">Concepto</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-muted-foreground">Descripción</th>
                        <th className="px-4 py-2 text-center text-xs font-semibold text-muted-foreground">Medio</th>
                        <th className="px-4 py-2 text-right text-xs font-semibold text-muted-foreground">Monto</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {rows.map((expense) => (
                        <tr key={expense.id} className="hover:bg-accent">
                          <td className="px-4 py-2 text-black font-medium">
                            {new Date(expense.date).toLocaleDateString('es-AR')}
                          </td>
                          <td className="px-4 py-2 text-black">{expense.concept}</td>
                          <td className="px-4 py-2 text-muted-foreground text-sm">
                            {expense.description || '-'}
                          </td>
                          <td className="px-4 py-2 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                expense.paymentMethod === 'transfer'
                                  ? 'bg-brand-orange/20 text-brand-orange-ink'
                                  : 'bg-brand-orange/20 text-brand-orange-ink'
                              }`}
                            >
                              {expense.paymentMethod === 'transfer' ? 'Transferencia' : 'Efectivo'}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-right text-destructive font-semibold">
                            {formatMoney(expense.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}

          {expensesReport.expenses.length === 0 && (
            <div className="bg-card rounded-xl shadow p-6 text-center text-muted-foreground">
              Sin egresos en el período.
            </div>
          )}
        </div>
      )}

      {!report && !isLoading && (
        <div className="bg-card rounded-xl shadow p-12 text-center">
          <TrendingUp className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Generá un reporte</h3>
          <p className="text-muted-foreground">Seleccioná un rango de fechas y hacé clic en "Generar Reporte"</p>
        </div>
      )}
    </div>
  );
}