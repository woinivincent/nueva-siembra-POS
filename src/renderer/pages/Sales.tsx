// src/renderer/pages/Sales.tsx
import { useCallback, useEffect, useState } from 'react';
import {
  Calendar,
  ShoppingBag,
  Banknote,
  ArrowLeftRight,
  User,
  Package,
  Search,
} from 'lucide-react';
import type { Sale } from '@/shared/types/electron';
import { SaleDetailModal } from '@/renderer/components/sales/SalesDetailModal';

type Preset = 'today' | 'week' | 'month' | 'custom';

function toInput(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Rango de fechas de cada atajo. La semana arranca el lunes. */
function rangeFor(preset: Exclude<Preset, 'custom'>): { start: string; end: string } {
  const today = new Date();
  const end = toInput(today);

  if (preset === 'today') return { start: end, end };

  if (preset === 'week') {
    const monday = new Date(today);
    const weekday = (today.getDay() + 6) % 7; // lunes = 0
    monday.setDate(today.getDate() - weekday);
    return { start: toInput(monday), end };
  }

  const first = new Date(today.getFullYear(), today.getMonth(), 1);
  return { start: toInput(first), end };
}

export function Sales() {
  const [preset, setPreset] = useState<Preset>('week');
  const [startDate, setStartDate] = useState(() => rangeFor('week').start);
  const [endDate, setEndDate] = useState(() => rangeFor('week').end);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSaleId, setSelectedSaleId] = useState<number | null>(null);

  const loadSales = useCallback(async () => {
    setLoading(true);
    try {
      const data = await window.electronAPI.sales.getByDateRange(startDate, endDate);
      setSales(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading sales:', error);
      setSales([]);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    loadSales();
  }, [loadSales]);

  function applyPreset(next: Exclude<Preset, 'custom'>) {
    const { start, end } = rangeFor(next);
    setPreset(next);
    setStartDate(start);
    setEndDate(end);
  }

  const formatMoney = (amount: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount);

  const formatDateTime = (date: Date | string) =>
    new Date(date).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

  // Filtro por cliente o número de venta
  const term = search.trim().toLowerCase();
  const filtered = term
    ? sales.filter(
        (sale) =>
          sale.customerName?.toLowerCase().includes(term) || String(sale.id).includes(term),
      )
    : sales;

  const total = filtered.reduce((sum, sale) => sum + sale.total, 0);
  const totalCash = filtered
    .filter((s) => s.paymentMethod === 'cash')
    .reduce((sum, s) => sum + s.total, 0);
  const totalTransfer = filtered
    .filter((s) => s.paymentMethod === 'transfer')
    .reduce((sum, s) => sum + s.total, 0);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Historial de Ventas</h1>
        <p className="text-sm text-muted-foreground">
          Detalle de cada venta: fecha, cliente, productos, medio de pago y total
        </p>
      </div>

      {/* Filtros */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          {([
            { id: 'today', label: 'Hoy' },
            { id: 'week', label: 'Esta semana' },
            { id: 'month', label: 'Este mes' },
          ] as const).map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => applyPreset(option.id)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium border transition-colors ${
                preset === option.id
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-secondary text-secondary-foreground border-transparent hover:bg-accent'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Desde</label>
            <div className="relative">
              <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setPreset('custom');
                  setStartDate(e.target.value);
                }}
                className="pl-8 pr-2 py-2 rounded-lg border border-border bg-background text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Hasta</label>
            <div className="relative">
              <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setPreset('custom');
                  setEndDate(e.target.value);
                }}
                className="pl-8 pr-2 py-2 rounded-lg border border-border bg-background text-sm"
              />
            </div>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-muted-foreground mb-1">Buscar</label>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cliente o número de venta"
                className="w-full pl-8 pr-2 py-2 rounded-lg border border-border bg-background text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Totales del período */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Ventas</p>
          <p className="text-2xl font-bold">{filtered.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total</p>
          <p className="text-2xl font-bold text-primary">{formatMoney(total)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <Banknote className="w-3 h-3" /> Efectivo
          </p>
          <p className="text-2xl font-bold text-green-500">{formatMoney(totalCash)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <ArrowLeftRight className="w-3 h-3" /> Transferencia
          </p>
          <p className="text-2xl font-bold text-orange-400">{formatMoney(totalTransfer)}</p>
        </div>
      </div>

      {/* Listado */}
      <div className="rounded-xl border border-border overflow-hidden">
        {loading ? (
          <p className="p-8 text-center text-muted-foreground">Cargando…</p>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center">
            <ShoppingBag className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground">No hay ventas en este período</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">Venta</th>
                  <th className="px-4 py-2 text-left font-medium">Fecha</th>
                  <th className="px-4 py-2 text-left font-medium">Cliente</th>
                  <th className="px-4 py-2 text-center font-medium">Unidades</th>
                  <th className="px-4 py-2 text-left font-medium">Medio de pago</th>
                  <th className="px-4 py-2 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((sale) => (
                  <tr
                    key={sale.id}
                    onClick={() => setSelectedSaleId(sale.id)}
                    className="border-t border-border hover:bg-accent/40 cursor-pointer"
                    title="Ver detalle de la venta"
                  >
                    <td className="px-4 py-2 font-semibold">#{sale.id}</td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {formatDateTime(sale.createdAt)}
                    </td>
                    <td className="px-4 py-2">
                      {sale.customerName ? (
                        <span className="inline-flex items-center gap-1">
                          <User className="w-3 h-3 text-muted-foreground" />
                          {sale.customerName}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Sin cliente</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <span className="inline-flex items-center gap-1 text-muted-foreground">
                        <Package className="w-3 h-3" />
                        {sale.itemsCount ?? 0}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                          sale.paymentMethod === 'cash'
                            ? 'bg-green-500/15 text-green-500'
                            : 'bg-orange-500/15 text-orange-400'
                        }`}
                      >
                        {sale.paymentMethod === 'cash' ? (
                          <>
                            <Banknote className="w-3 h-3" /> Efectivo
                          </>
                        ) : (
                          <>
                            <ArrowLeftRight className="w-3 h-3" /> Transferencia
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right font-bold text-primary tabular-nums">
                      {formatMoney(sale.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <SaleDetailModal
        isOpen={selectedSaleId !== null}
        saleId={selectedSaleId}
        onClose={() => setSelectedSaleId(null)}
      />
    </div>
  );
}
