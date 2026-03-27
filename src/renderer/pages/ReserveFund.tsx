// src/renderer/pages/ReserveFund.tsx
import { useEffect, useState } from 'react';
import { 
  Vault, 
  Plus, 
  Minus, 
  Download, 
  Filter,
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowRightLeft
} from 'lucide-react';
import { ReserveMovementModal } from '../components/reserve/ReserveMovementModal';
import { TransferFromCashModal } from '../components/reserve/TransferCashModal';

interface ReserveMovement {
  id: number;
  type: 'income' | 'expense';
  amount: number;
  concept: string;
  category: string | null;
  description: string | null;
  createdAt: Date;
}

interface ReserveSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  movementsCount: number;
}

export function ReserveFund() {
  const [movements, setMovements] = useState<ReserveMovement[]>([]);
  const [summary, setSummary] = useState<ReserveSummary | null>(null);
  const [summaryByCategory, setSummaryByCategory] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Modales
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [movementType, setMovementType] = useState<'income' | 'expense'>('expense');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setIsLoading(true);
    try {
      const [movementsData, summaryData, categoryData, categoriesData] = await Promise.all([
        window.electronAPI.reserve.getAll(200),
        window.electronAPI.reserve.getSummary(),
        window.electronAPI.reserve.getSummaryByCategory(),
        window.electronAPI.reserve.getCategories(),
      ]);
      
      setMovements(movementsData);
      setSummary(summaryData);
      setSummaryByCategory(categoryData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading reserve data:', error);
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

  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };



  async function handleDelete(id: number) {
    if (!confirm('¿Eliminar este movimiento?')) return;
    
    try {
      await window.electronAPI.reserve.delete(id);
      loadData();
    } catch (error) {
      console.error('Error deleting movement:', error);
      alert('Error al eliminar el movimiento');
    }
  }

  function handleOpenMovementModal(type: 'income' | 'expense') {
    setMovementType(type);
    setShowMovementModal(true);
  }

  async function handleExportCSV() {
  try {
    const filePath = await window.electronAPI.reserve.exportExcel();
    if (filePath) {
      alert(`✅ Excel guardado en:\n${filePath}`);
    }
  } catch (error) {
    console.error('Error exporting:', error);
    alert('Error al exportar');
  }
}

  const filteredMovements = selectedCategory === 'all' 
    ? movements 
    : movements.filter(m => m.category === selectedCategory || (!m.category && selectedCategory === 'sin-categoria'));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Vault className="w-7 h-7 text-amber-600" />
            Caja Reserva
          </h1>
          <p className="text-gray-500">Fondos separados para gastos fijos y cuentas</p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 border border-gray-300 text-white bg-green-600 rounded-lg hover:bg-gray-50 hover:text-black flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Exportar
          </button>
          <button
            onClick={() => setShowTransferModal(true)}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 flex items-center gap-2"
          >
            <ArrowRightLeft className="w-4 h-4" />
            Transferir desde Caja
          </button>
        </div>
      </div>

      {/* KPIs */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-100 rounded-lg">
                <Wallet className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Balance Actual</p>
                <p className={`text-2xl font-bold ${summary.balance >= 0 ? 'text-amber-600' : 'text-red-600'}`}>
                  {formatMoney(summary.balance)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Ingresos</p>
                <p className="text-2xl font-bold text-green-600">{formatMoney(summary.totalIncome)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 rounded-lg">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Egresos</p>
                <p className="text-2xl font-bold text-red-600">{formatMoney(summary.totalExpense)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Filter className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Movimientos</p>
                <p className="text-2xl font-bold text-blue-600">{summary.movementsCount}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resumen por categoría */}
      {summaryByCategory.length > 0 && (
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="font-semibold text-gray-800 mb-4">📊 Resumen por Categoría</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {summaryByCategory.map((cat) => (
              <div key={cat.category} className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-700 truncate">{cat.category}</p>
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-green-600">Ingresos:</span>
                    <span>{formatMoney(cat.income)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-red-600">Egresos:</span>
                    <span>{formatMoney(cat.expense)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold pt-1 border-t">
                    <span>Balance:</span>
                    <span className={cat.balance >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {formatMoney(cat.balance)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Acciones y Filtros */}
      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => handleOpenMovementModal('income')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Ingreso Manual
            </button>
            <button
              onClick={() => handleOpenMovementModal('expense')}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
            >
              <Minus className="w-4 h-4" />
              Registrar Gasto
            </button>
          </div>

          {categories.length > 0 && (
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
              >
                <option value="all">Todas las categorías</option>
                <option value="sin-categoria">Sin categoría</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Lista de movimientos */}
      {isLoading ? (
        <div className="bg-white rounded-xl shadow p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
            <span className="ml-3 text-gray-500">Cargando movimientos...</span>
          </div>
        </div>
      ) : filteredMovements.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-12 text-center">
          <Vault className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">Sin movimientos</h3>
          <p className="text-gray-500">
            {selectedCategory !== 'all' 
              ? 'No hay movimientos en esta categoría' 
              : 'Transferí dinero desde la caja diaria para comenzar'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Fecha</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Tipo</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Concepto</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Categoría</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Monto</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredMovements.map((movement) => (
                  <tr key={movement.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatDateTime(movement.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        movement.type === 'income' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {movement.type === 'income' ? '📥 Ingreso' : '📤 Egreso'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{movement.concept}</p>
                      {movement.description && (
                        <p className="text-xs text-gray-500">{movement.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {movement.category ? (
                        <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded-full">
                          {movement.category}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className={`px-4 py-3 text-right font-semibold ${
                      movement.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {movement.type === 'income' ? '+' : '-'}{formatMoney(movement.amount)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleDelete(movement.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modales */}
      <ReserveMovementModal
        isOpen={showMovementModal}
        onClose={() => setShowMovementModal(false)}
        onSaved={() => {
          setShowMovementModal(false);
          loadData();
        }}
        type={movementType}
        categories={categories}
        currentBalance={summary?.balance || 0}
      />

      <TransferFromCashModal
        isOpen={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        onSaved={() => {
          setShowTransferModal(false);
          loadData();
        }}
        categories={categories}
      />
    </div>
  );
}