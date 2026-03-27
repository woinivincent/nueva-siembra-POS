// src/components/cash/CashSummary.tsx
import { useState } from 'react';
import { useCashRegisterStore } from '../../stores/cash-register.stores';

export function CashSummary() {
  const { summary } = useCashRegisterStore();
  const [showElectronicDetail, setShowElectronicDetail] = useState(false);

  if (!summary) {
    return (
      <div className="bg-white rounded-xl shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const { cashFlow, electronic, totalSales, totalTransactions } = summary;

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(amount);
  };

  return (
    <div className="space-y-4">
      {/* Totales Generales */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">📊 Resumen del Día</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm text-green-600 font-medium">Total Ventas</p>
            <p className="text-2xl font-bold text-green-700">{formatMoney(totalSales)}</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-blue-600 font-medium">Transacciones</p>
            <p className="text-2xl font-bold text-blue-700">{totalTransactions}</p>
          </div>
        </div>
      </div>

      {/* Efectivo */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">💵 Efectivo</h2>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-gray-600">Monto inicial</span>
            <span className="font-medium">{formatMoney(cashFlow.opening)}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-gray-600">Ventas en efectivo</span>
            <span className="font-medium text-green-600">+{formatMoney(cashFlow.salesCash)}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-gray-600">Ingresos manuales</span>
            <span className="font-medium text-green-600">+{formatMoney(cashFlow.income)}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-gray-600">Egresos</span>
            <span className="font-medium text-red-600">-{formatMoney(cashFlow.expense)}</span>
          </div>
          <div className="flex justify-between items-center py-3 bg-gray-50 rounded-lg px-3 mt-2">
            <span className="font-semibold text-gray-800">Efectivo esperado</span>
            <span className="text-xl font-bold text-gray-900">{formatMoney(cashFlow.expected)}</span>
          </div>
        </div>
      </div>

      {/* Medios Electrónicos */}
      <div className="bg-white rounded-xl shadow p-6">
        <button
          onClick={() => setShowElectronicDetail(!showElectronicDetail)}
          className="w-full flex justify-between items-center"
        >
          <h2 className="text-lg font-semibold text-gray-800">💳 Medios Electrónicos</h2>
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold text-gray-900">{formatMoney(electronic.total)}</span>
            <span className={`transform transition-transform ${showElectronicDetail ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </div>
        </button>

        {/* Detalle expandible */}
        {showElectronicDetail && (
          <div className="mt-4 space-y-3 pt-4 border-t border-gray-100">
            <div className="flex justify-between items-center py-2">
              <div className="flex items-center gap-2">
                <span className="text-blue-500">💳</span>
                <span className="text-gray-600">Débito</span>
                <span className="text-xs text-gray-400">({electronic.debit.count} ventas)</span>
              </div>
              <span className="font-medium text-gray-800">{formatMoney(electronic.debit.total)}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <div className="flex items-center gap-2">
                <span className="text-purple-500">💳</span>
                <span className="text-gray-600">Crédito</span>
                <span className="text-xs text-gray-400">({electronic.credit.count} ventas)</span>
              </div>
              <span className="font-medium text-gray-800">{formatMoney(electronic.credit.total)}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <div className="flex items-center gap-2">
                <span className="text-green-500">📱</span>
                <span className="text-gray-600">Transferencia</span>
                <span className="text-xs text-gray-400">({electronic.transfer.count} ventas)</span>
              </div>
              <span className="font-medium text-gray-800">{formatMoney(electronic.transfer.total)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}