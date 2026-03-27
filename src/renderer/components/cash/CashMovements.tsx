// src/renderer/components/cash/CashMovements.tsx
import { useState } from 'react';
import { useCashRegisterStore } from '../../stores/cash-register.stores';
import { SaleDetailModal } from '../sales/SalesDetailModal';

export function CashMovements() {
  const { movements, deleteMovement, isLoading } = useCashRegisterStore();
  const [selectedSaleId, setSelectedSaleId] = useState<number | null>(null);
  const [showSaleDetail, setShowSaleDetail] = useState(false);

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(amount);
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'sale':
        return { icon: '🛒', label: 'Venta', color: 'text-green-600', bg: 'bg-green-50' };
      case 'income':
        return { icon: '📥', label: 'Ingreso', color: 'text-blue-600', bg: 'bg-blue-50' };
      case 'expense':
        return { icon: '📤', label: 'Egreso', color: 'text-red-600', bg: 'bg-red-50' };
      default:
        return { icon: '💰', label: type, color: 'text-gray-600', bg: 'bg-gray-50' };
    }
  };

  const handleDelete = async (id: number, type: string) => {
    if (type === 'sale') {
      alert('No se pueden eliminar ventas');
      return;
    }
    
    if (confirm('¿Eliminar este movimiento?')) {
      await deleteMovement(id);
    }
  };

  const handleMovementClick = (movement: any) => {
    if (movement.type === 'sale') {
      // Extraer ID de venta del concepto "Venta #123"
      const match = movement.concept.match(/Venta #(\d+)/);
      if (match) {
        setSelectedSaleId(parseInt(match[1]));
        setShowSaleDetail(true);
      }
    }
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow p-6 h-full">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">📋 Movimientos</h2>

        {movements.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <div className="text-4xl mb-2">📭</div>
            <p>No hay movimientos aún</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {movements.map((movement) => {
              const config = getTypeConfig(movement.type);
              const isClickable = movement.type === 'sale';
              
              return (
                <div
                  key={movement.id}
                  onClick={() => handleMovementClick(movement)}
                  className={`${config.bg} rounded-lg p-3 flex items-center justify-between group ${
                    isClickable ? 'cursor-pointer hover:ring-2 hover:ring-green-300 transition-all' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{config.icon}</span>
                    <div>
                      <p className="font-medium text-gray-800 text-sm">
                        {movement.concept}
                        {isClickable && (
                          <span className="ml-2 text-xs text-green-600">(ver detalle)</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatTime(movement.createdAt)}
                        {movement.description && ` • ${movement.description}`}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold ${config.color}`}>
                      {movement.type === 'expense' ? '-' : '+'}
                      {formatMoney(movement.amount)}
                    </span>
                    
                    {movement.type !== 'sale' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(movement.id, movement.type);
                        }}
                        disabled={isLoading}
                        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity p-1"
                        title="Eliminar"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
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