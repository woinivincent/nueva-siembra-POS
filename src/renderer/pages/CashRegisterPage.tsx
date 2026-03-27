// src/renderer/pages/CashRegisterPage.tsx
import { useEffect, useState } from "react";
import { useCashRegisterStore } from "../stores/cash-register.stores";
import { OpenCashModal } from "../components/cash/OpenCashModal";
import { CloseCashModal } from "../components/cash/CloseCashModal";
import { CashSummary } from "../components/cash/CashSummary";
import { CashMovements } from "../components/cash/CashMovements";
import { NewMovementModal } from "../components/cash/NewMovementModal";
import { Download, History, ChevronDown, ChevronUp } from "lucide-react";

interface CashRegisterHistory {
  id: number;
  openedAt: Date;
  closedAt: Date | null;
  openingAmount: number;
  closingAmount: number | null;
  expectedAmount: number | null;
  difference: number | null;
  status: "open" | "closed";
  notes: string | null;
}

export function CashRegisterPage() {
  const { currentRegister, isLoading, error, loadCurrentRegister, clearError } =
    useCashRegisterStore();

  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [movementType, setMovementType] = useState<"income" | "expense">(
    "income"
  );

  // Historial
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<CashRegisterHistory[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  useEffect(() => {
    loadCurrentRegister();
  }, []);

  const handleAddMovement = (type: "income" | "expense") => {
    setMovementType(type);
    setShowMovementModal(true);
  };

  // Mostrar error si existe
  useEffect(() => {
    if (error) {
      setTimeout(() => clearError(), 5000);
    }
  }, [error]);

  async function loadHistory() {
    setIsLoadingHistory(true);
    try {
      const data = await window.electronAPI.cash.getHistory(20);
      setHistory(data);
    } catch (error) {
      console.error("Error loading history:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  }

  function handleToggleHistory() {
    if (!showHistory) {
      loadHistory();
    }
    setShowHistory(!showHistory);
  }

  async function handleExportCash(registerId?: number) {
  const targetId = registerId || currentRegister?.id;
  if (!targetId) return;

  try {
    const filePath = await window.electronAPI.cash.exportExcel(targetId);
    if (filePath) {
      alert(`✅ Excel guardado en:\n${filePath}`);
    }
  } catch (error) {
    console.error('Error exporting:', error);
    alert('Error al exportar');
  }
}
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(amount);
  };

  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Caja</h1>
          <p className="text-gray-500">
            {currentRegister
              ? `Abierta desde ${new Date(currentRegister.openedAt).toLocaleString()}`
              : "No hay caja abierta"}
          </p>
        </div>

        <div className="flex gap-3">
          {!currentRegister ? (
            <button
              onClick={() => setShowOpenModal(true)}
              disabled={isLoading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
            >
              <span>💵</span> Abrir Caja
            </button>
          ) : (
            <>
              <button
                onClick={() => handleAddMovement("income")}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                <span>📥</span> Ingreso
              </button>
              <button
                onClick={() => handleAddMovement("expense")}
                disabled={isLoading}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center gap-2"
              >
                <span>📤</span> Egreso
              </button>
              <button
                onClick={() => setShowCloseModal(true)}
                disabled={isLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                <span>🔒</span> Cerrar Caja
              </button>
              <button
                onClick={() => handleExportCash()}
                disabled={!currentRegister}
                className="px-4 py-2 border border-green-500 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-2 disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                Exportar
              </button>
            </>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Content */}
      {currentRegister ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Resumen - 2 columnas */}
          <div className="lg:col-span-2">
            <CashSummary />
          </div>

          {/* Movimientos - 1 columna */}
          <div className="lg:col-span-1">
            <CashMovements />
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-xl">
          <div className="text-6xl mb-4">💰</div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            No hay caja abierta
          </h2>
          <p className="text-gray-500 mb-6">
            Abrí una caja para comenzar a registrar ventas
          </p>
          <button
            onClick={() => setShowOpenModal(true)}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 text-lg"
          >
            <span>💵</span> Abrir Caja
          </button>
        </div>
      )}

      {/* Historial de cajas */}
      <div className="bg-white rounded-xl shadow">
        <button
          onClick={handleToggleHistory}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50 rounded-xl"
        >
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-gray-500" />
            <span className="font-semibold text-gray-800">
              Historial de Cajas
            </span>
          </div>
          {showHistory ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>

        {showHistory && (
          <div className="border-t border-gray-200 p-4">
            {isLoadingHistory ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : history.length === 0 ? (
              <p className="text-center text-gray-400 py-4">
                No hay historial de cajas
              </p>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {history.map((register) => (
                  <div
                    key={register.id}
                    className={`p-3 rounded-lg border ${
                      register.status === "open"
                        ? "bg-green-50 border-green-200"
                        : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          Caja #{register.id}
                          {register.status === "open" && (
                            <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                              Actual
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-gray-500">
                          Abierta: {formatDateTime(register.openedAt)}
                          {register.closedAt && (
                            <> • Cerrada: {formatDateTime(register.closedAt)}</>
                          )}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          {formatMoney(
                            register.closingAmount ?? register.openingAmount
                          )}
                        </p>
                        {register.difference !== null && (
                          <p
                            className={`text-sm ${
                              register.difference === 0
                                ? "text-green-600"
                                : register.difference > 0
                                  ? "text-blue-600"
                                  : "text-red-600"
                            }`}
                          >
                            {register.difference === 0
                              ? "✓ Cuadrada"
                              : register.difference > 0
                                ? `+${formatMoney(register.difference)}`
                                : formatMoney(register.difference)}
                          </p>
                        )}
                      </div>
                    </div>
                    {register.notes && (
                      <p className="text-sm text-gray-500 mt-2 italic">
                        "{register.notes}"
                      </p>
                    )}
                    {register.status === "closed" && (
                      <button
                        onClick={() => handleExportCash(register.id)}
                        className="mt-2 text-sm text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" />
                        Exportar
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <OpenCashModal
        isOpen={showOpenModal}
        onClose={() => {
          setShowOpenModal(false);
          loadCurrentRegister();
        }}
      />

      <CloseCashModal
        isOpen={showCloseModal}
        onClose={() => {
          setShowCloseModal(false);
          loadCurrentRegister();
          if (showHistory) loadHistory();
        }}
      />

      <NewMovementModal
        isOpen={showMovementModal}
        onClose={() => setShowMovementModal(false)}
        type={movementType}
      />
    </div>
  );
}