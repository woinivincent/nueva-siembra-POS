// src/renderer/components/pos/PaymentModal.tsx
import { useState, useEffect } from "react";
import {
  Banknote,
  CreditCard,
  ArrowLeftRight,
  CheckCircle,
  Printer,
  Download,
  Split,
  User,
  CreditCard as PaymentIcon,
} from "lucide-react";

import { Button } from "@/renderer/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/renderer/components/ui/dialog";
import { useCartStore } from "@/renderer/stores/cart.stores";
import { ticketService, type PaymentMethod } from "@/renderer/services/ticket.service";
import type { Customer } from "@/shared/types/electron";
import { CustomerFormModal } from "@/renderer/components/customers/CustomersFormModal";

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const paymentMethods: {
  id: PaymentMethod;
  label: string;
  icon: React.ElementType;
  color: string;
}[] = [
  { id: "cash", label: "Efectivo", icon: Banknote, color: "bg-green-500" },
  { id: "debit", label: "Débito", icon: CreditCard, color: "bg-blue-500" },
  { id: "credit", label: "Crédito", icon: CreditCard, color: "bg-purple-500" },
  { id: "transfer", label: "Transferencia", icon: ArrowLeftRight, color: "bg-orange-500" },
];

type TabType = "payment" | "customer";

export function PaymentModal({ open, onOpenChange }: PaymentModalProps) {
  const { items, subtotal, discount, total, priceList, clearCart } = useCartStore();

  // Tab activo
  const [activeTab, setActiveTab] = useState<TabType>("payment");

  // Cliente (opcional)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerResults, setCustomerResults] = useState<Customer[]>([]);
  const [isCustomerLoading, setIsCustomerLoading] = useState(false);
  const [isCreateCustomerOpen, setIsCreateCustomerOpen] = useState(false);

  // Pago simple
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(
    priceList === "cash" ? "cash" : "debit"
  );
  const [cashReceived, setCashReceived] = useState("");

  // Pago mixto
  const [isMixedPayment, setIsMixedPayment] = useState(false);
  const [mixedMethod1, setMixedMethod1] = useState<PaymentMethod>("cash");
  const [mixedAmount1, setMixedAmount1] = useState("");
  const [mixedMethod2, setMixedMethod2] = useState<PaymentMethod>("debit");
  const [mixedAmount2, setMixedAmount2] = useState("");

  const [isProcessing, setIsProcessing] = useState(false);
  const [saleCompleted, setSaleCompleted] = useState(false);
  const [completedSaleId, setCompletedSaleId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Reset cuando se abre el modal
  useEffect(() => {
    if (open) {
      setActiveTab("payment");
      setSelectedCustomer(null);
      setCustomerSearch("");
      setCustomerResults([]);
      setIsCustomerLoading(false);
      setIsCreateCustomerOpen(false);

      setSelectedMethod(priceList === "cash" ? "cash" : "debit");
      setCashReceived("");
      setIsMixedPayment(false);
      setMixedMethod1("cash");
      setMixedAmount1("");
      setMixedMethod2("debit");
      setMixedAmount2("");
      setSaleCompleted(false);
      setCompletedSaleId(null);
      setError(null);
    }
  }, [open, priceList]);

  // Buscar clientes (debounce)
  useEffect(() => {
    if (!open || activeTab !== "customer") return;

    const term = customerSearch.trim();
    const t = setTimeout(async () => {
      if (!term) {
        setCustomerResults([]);
        return;
      }

      setIsCustomerLoading(true);
      try {
        const results = await window.electronAPI.customers.search(term);
        setCustomerResults(results);
      } catch (e) {
        console.error("Error searching customers:", e);
        setCustomerResults([]);
      } finally {
        setIsCustomerLoading(false);
      }
    }, 250);

    return () => clearTimeout(t);
  }, [customerSearch, activeTab, open]);

  const cashReceivedNum = parseFloat(cashReceived) || 0;
  const change = cashReceivedNum - total;

  // Cálculos pago mixto
  const mixedAmount1Num = parseFloat(mixedAmount1) || 0;
  const mixedAmount2Num = parseFloat(mixedAmount2) || 0;
  const mixedTotal = mixedAmount1Num + mixedAmount2Num;
  const mixedRemaining = total - mixedTotal;

  const formatMoney = (amount: number) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(amount);

  // Validaciones
  const canCompleteSimple =
    selectedMethod !== "cash" || (cashReceivedNum >= total && total > 0);

  const canCompleteMixed =
    Math.abs(mixedRemaining) < 0.01 &&
    (mixedAmount1Num > 0 || mixedAmount2Num > 0);

  const canComplete = isMixedPayment ? canCompleteMixed : canCompleteSimple;

  const handleAutoFillRemaining = () => {
    const remaining = total - mixedAmount1Num;
    if (remaining > 0) {
      setMixedAmount2(remaining.toFixed(2));
    }
  };

  const handleComplete = async () => {
    if (!canComplete || items.length === 0) return;

    setIsProcessing(true);
    setError(null);

    try {
      const cashRegister = await window.electronAPI.cash.getOpen();
      if (!cashRegister) {
        setError("No hay caja abierta. Abrí la caja antes de realizar ventas.");
        setIsProcessing(false);
        return;
      }

      let primaryPaymentMethod: PaymentMethod;
      if (isMixedPayment) {
        primaryPaymentMethod = mixedAmount1Num >= mixedAmount2Num ? mixedMethod1 : mixedMethod2;
      } else {
        primaryPaymentMethod = selectedMethod;
      }

      const saleData = {
        customerId: selectedCustomer?.id,
        cashRegisterId: cashRegister.id,
        subtotal,
        tax: 0,
        discount,
        total,
        paymentMethod: primaryPaymentMethod,
        payments: isMixedPayment
          ? [
              { method: mixedMethod1, amount: mixedAmount1Num },
              { method: mixedMethod2, amount: mixedAmount2Num },
            ].filter((p) => p.amount > 0)
          : undefined,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: priceList === "cash" ? item.price : item.priceCard,
          discount: 0,
          subtotal: item.subtotal,
        })),
      };

      const result = await window.electronAPI.sales.create(saleData);
      setCompletedSaleId(result.id);
      setSaleCompleted(true);
    } catch (err: any) {
      console.error("Error creating sale:", err);
      setError(err.message || "Error al procesar la venta");
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrintTicket = async () => {
    if (!completedSaleId) return;
    try {
      const settings = await window.electronAPI.settings.getAll();
      const ticketData = {
        saleId: completedSaleId,
        date: new Date(),
        items: items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          price: priceList === "cash" ? item.price : item.priceCard,
          subtotal: item.subtotal,
        })),
        subtotal,
        discount,
        total,
        customerName: selectedCustomer ? `${selectedCustomer.firstName} ${selectedCustomer.lastName}` : undefined,
        paymentMethod: selectedMethod,
        cashReceived: selectedMethod === "cash" ? cashReceivedNum : undefined,
        change: selectedMethod === "cash" ? change : undefined,
      };
      const businessInfo = {
        name: settings.businessName,
        address: settings.businessAddress,
        phone: settings.businessPhone,
        cuit: settings.businessCuit,
        ticketHeader: settings.ticketHeader,
        ticketFooter: settings.ticketFooter,
        currencySymbol: settings.currencySymbol,
      };
      await ticketService.printTicket(ticketData, businessInfo);
    } catch (error) {
      console.error("Error printing ticket:", error);
    }
  };

  const handleDownloadTicket = async () => {
    if (!completedSaleId) return;
    try {
      const settings = await window.electronAPI.settings.getAll();
      const ticketData = {
        saleId: completedSaleId,
        date: new Date(),
        items: items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          price: priceList === "cash" ? item.price : item.priceCard,
          subtotal: item.subtotal,
        })),
        subtotal,
        discount,
        total,
        customerName: selectedCustomer ? `${selectedCustomer.firstName} ${selectedCustomer.lastName}` : undefined,
        paymentMethod: selectedMethod,
        cashReceived: selectedMethod === "cash" ? cashReceivedNum : undefined,
        change: selectedMethod === "cash" ? change : undefined,
      };
      const businessInfo = {
        name: settings.businessName,
        address: settings.businessAddress,
        phone: settings.businessPhone,
        cuit: settings.businessCuit,
        ticketHeader: settings.ticketHeader,
        ticketFooter: settings.ticketFooter,
        currencySymbol: settings.currencySymbol,
      };
      await ticketService.downloadTicket(ticketData, businessInfo);
    } catch (error) {
      console.error("Error downloading ticket:", error);
    }
  };

  const handleClose = () => {
    if (saleCompleted) {
      clearCart();
    }
    onOpenChange(false);
  };

  const handleNewSale = () => {
    clearCart();
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {saleCompleted ? "✅ Venta Completada" : "Finalizar Venta"}
            </DialogTitle>
          </DialogHeader>

          {saleCompleted ? (
            /* VENTA COMPLETADA */
            <div className="space-y-4 py-2">
              <div className="text-center">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-green-600">{formatMoney(total)}</p>
                <p className="text-gray-500 text-sm">Venta #{completedSaleId?.toString().padStart(6, "0")}</p>

                {selectedCustomer && (
                  <p className="text-sm text-gray-600 mt-1">
                    Cliente: {selectedCustomer.firstName} {selectedCustomer.lastName}
                  </p>
                )}

                {isMixedPayment && (
                  <div className="mt-2 p-2 bg-gray-50 rounded-lg text-xs">
                    <p className="font-medium text-gray-700">Pago dividido:</p>
                    <p className="text-gray-600">
                      {paymentMethods.find((m) => m.id === mixedMethod1)?.label}: {formatMoney(mixedAmount1Num)}
                    </p>
                    <p className="text-gray-600">
                      {paymentMethods.find((m) => m.id === mixedMethod2)?.label}: {formatMoney(mixedAmount2Num)}
                    </p>
                  </div>
                )}

                {!isMixedPayment && selectedMethod === "cash" && change > 0 && (
                  <div className="mt-3 p-2 bg-yellow-50 rounded-lg">
                    <p className="text-xs text-yellow-700">Cambio a entregar:</p>
                    <p className="text-lg font-bold text-yellow-700">{formatMoney(change)}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button onClick={handlePrintTicket} variant="outline" className="flex-1 gap-2 text-sm">
                  <Printer className="w-4 h-4" />
                  Imprimir
                </Button>
                <Button onClick={handleDownloadTicket} variant="outline" className="flex-1 gap-2 text-sm">
                  <Download className="w-4 h-4" />
                  Descargar
                </Button>
              </div>

              <Button onClick={handleNewSale} className="w-full">
                Nueva Venta
              </Button>
            </div>
          ) : (
            /* FORMULARIO DE PAGO */
            <div className="space-y-4 py-2">
              {/* Total */}
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Total a cobrar</p>
                <p className="text-2xl font-bold">{formatMoney(total)}</p>
                {discount > 0 && (
                  <p className="text-xs text-green-600">Descuento: -{formatMoney(discount)}</p>
                )}
                {selectedCustomer && (
                  <p className="text-xs text-blue-600 mt-1">
                    👤 {selectedCustomer.firstName} {selectedCustomer.lastName}
                  </p>
                )}
              </div>

              {/* Tabs */}
              <div className="flex border-b">
                <button
                  type="button"
                  onClick={() => setActiveTab("payment")}
                  className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2 ${
                    activeTab === "payment"
                      ? "border-primary text-primary"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <PaymentIcon className="w-4 h-4" />
                  Pago
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("customer")}
                  className={`flex-1 py-2 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2 ${
                    activeTab === "customer"
                      ? "border-primary text-primary"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <User className="w-4 h-4" />
                  Cliente
                  {selectedCustomer && <span className="w-2 h-2 bg-green-500 rounded-full"></span>}
                </button>
              </div>

              {/* Tab Content */}
              {activeTab === "payment" ? (
                /* TAB PAGO */
                <div className="space-y-4">
                  {/* Toggle pago mixto */}
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={() => setIsMixedPayment(!isMixedPayment)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 transition-all text-sm ${
                        isMixedPayment
                          ? "border-purple-500 bg-purple-50 text-purple-700"
                          : "border-gray-200 hover:border-gray-300 text-gray-600"
                      }`}
                    >
                      <Split className="w-4 h-4" />
                      <span className="font-medium">
                        {isMixedPayment ? "Pago dividido" : "Dividir pago"}
                      </span>
                    </button>
                  </div>

                  {!isMixedPayment ? (
                    <>
                      {/* Métodos de pago simple */}
                      <div className="grid grid-cols-4 gap-2">
                        {paymentMethods.map((method) => {
                          const Icon = method.icon;
                          const isSelected = selectedMethod === method.id;
                          return (
                            <button
                              key={method.id}
                              type="button"
                              onClick={() => setSelectedMethod(method.id)}
                              className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1 ${
                                isSelected
                                  ? `border-primary ${method.color} text-white`
                                  : "border-gray-200 hover:border-gray-300"
                              }`}
                            >
                              <Icon className="w-5 h-5" />
                              <span className="text-xs font-medium">{method.label}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Campo efectivo */}
                      {selectedMethod === "cash" && (
                        <div className="space-y-2">
                          <div>
                            <label className="block text-xs font-medium mb-1">Efectivo recibido</label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                              <input
                                type="number"
                                value={cashReceived}
                                onChange={(e) => setCashReceived(e.target.value)}
                                placeholder="0.00"
                                step="0.01"
                                min="0"
                                autoFocus
                                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg text-lg font-semibold text-gray-900 bg-white"
                              />
                            </div>
                          </div>

                          {cashReceivedNum > 0 && (
                            <div className={`p-2 rounded-lg text-sm ${change >= 0 ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                              <div className="flex justify-between items-center">
                                <span>Cambio:</span>
                                <span className="text-lg font-bold">{formatMoney(Math.max(0, change))}</span>
                              </div>
                            </div>
                          )}

                          <div className="flex gap-1 flex-wrap">
                            {[100, 200, 500, 1000, 2000, 5000].map((amount) => (
                              <button
                                key={amount}
                                type="button"
                                onClick={() => setCashReceived(amount.toString())}
                                className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs text-gray-600"
                              >
                                ${amount}
                              </button>
                            ))}
                            <button
                              type="button"
                              onClick={() => setCashReceived(Math.ceil(total).toString())}
                              className="px-2 py-1 bg-green-100 hover:bg-green-200 text-green-700 rounded text-xs"
                            >
                              Exacto
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    /* PAGO MIXTO */
                    <div className="space-y-3">
                      {/* Pago 1 */}
                      <div className="p-2 border rounded-lg space-y-2">
                        <span className="text-xs font-medium text-gray-700">Pago 1</span>
                        <div className="grid grid-cols-4 gap-1">
                          {paymentMethods.map((method) => {
                            const Icon = method.icon;
                            return (
                              <button
                                key={method.id}
                                type="button"
                                onClick={() => setMixedMethod1(method.id)}
                                className={`p-1.5 rounded flex flex-col items-center gap-0.5 ${
                                  mixedMethod1 === method.id
                                    ? `${method.color} text-white`
                                    : "bg-gray-100 hover:bg-gray-200 text-gray-600"
                                }`}
                              >
                                <Icon className="w-4 h-4" />
                                <span className="text-[10px]">{method.label}</span>
                              </button>
                            );
                          })}
                        </div>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                          <input
                            type="number"
                            value={mixedAmount1}
                            onChange={(e) => setMixedAmount1(e.target.value)}
                            placeholder="0.00"
                            className="w-full pl-7 pr-3 py-1.5 border border-gray-300 rounded-lg text-base font-semibold text-gray-900 bg-white"
                          />
                        </div>
                      </div>

                      {/* Pago 2 */}
                      <div className="p-2 border rounded-lg space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-medium text-gray-700">Pago 2</span>
                          <button
                            type="button"
                            onClick={handleAutoFillRemaining}
                            className="text-[10px] text-purple-600 hover:text-purple-700"
                          >
                            Completar restante
                          </button>
                        </div>
                        <div className="grid grid-cols-4 gap-1">
                          {paymentMethods.map((method) => {
                            const Icon = method.icon;
                            return (
                              <button
                                key={method.id}
                                type="button"
                                onClick={() => setMixedMethod2(method.id)}
                                className={`p-1.5 rounded flex flex-col items-center gap-0.5 ${
                                  mixedMethod2 === method.id
                                    ? `${method.color} text-white`
                                    : "bg-gray-100 hover:bg-gray-200 text-gray-600"
                                }`}
                              >
                                <Icon className="w-4 h-4" />
                                <span className="text-[10px]">{method.label}</span>
                              </button>
                            );
                          })}
                        </div>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                          <input
                            type="number"
                            value={mixedAmount2}
                            onChange={(e) => setMixedAmount2(e.target.value)}
                            placeholder="0.00"
                            className="w-full pl-7 pr-3 py-1.5 border border-gray-300 rounded-lg text-base font-semibold text-gray-900 bg-white"
                          />
                        </div>
                      </div>

                      {/* Resumen */}
                      <div
                        className={`p-2 rounded-lg text-xs ${
                          Math.abs(mixedRemaining) < 0.01
                            ? "bg-green-50 text-green-700"
                            : mixedRemaining > 0
                            ? "bg-yellow-50 text-yellow-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        <div className="flex justify-between">
                          <span>Total ingresado:</span>
                          <span className="font-semibold">{formatMoney(mixedTotal)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>{Math.abs(mixedRemaining) < 0.01 ? "✓ Completo" : mixedRemaining > 0 ? "Falta:" : "Excede:"}</span>
                          <span className="font-bold">
                            {Math.abs(mixedRemaining) < 0.01 ? "" : formatMoney(Math.abs(mixedRemaining))}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* TAB CLIENTE */
                <div className="space-y-3">
                  {selectedCustomer ? (
                    <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">
                            {selectedCustomer.firstName} {selectedCustomer.lastName}
                          </p>
                          {selectedCustomer.phone && (
                            <p className="text-xs text-gray-500">{selectedCustomer.phone}</p>
                          )}
                          {selectedCustomer.email && (
                            <p className="text-xs text-gray-500">{selectedCustomer.email}</p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCustomer(null);
                            setCustomerSearch("");
                            setCustomerResults([]);
                          }}
                          className="text-xs text-red-600 hover:text-red-700"
                        >
                          Quitar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <input
                        type="text"
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                        placeholder="Buscar por nombre, teléfono..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white"
                        autoFocus
                      />

                      <div className="border rounded-lg overflow-hidden bg-white max-h-48 overflow-y-auto">
                        {isCustomerLoading ? (
                          <div className="p-3 text-sm text-gray-500">Buscando...</div>
                        ) : customerSearch.trim() && customerResults.length === 0 ? (
                          <div className="p-3 text-center">
                            <p className="text-sm text-gray-500 mb-2">Sin resultados</p>
                            <button
                              type="button"
                              onClick={() => setIsCreateCustomerOpen(true)}
                              className="text-sm px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                            >
                              Crear cliente nuevo
                            </button>
                          </div>
                        ) : customerResults.length > 0 ? (
                          <div className="divide-y">
                            {customerResults.map((c) => (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => {
                                  setSelectedCustomer(c);
                                  setCustomerSearch("");
                                  setCustomerResults([]);
                                  setActiveTab("payment");
                                }}
                                className="w-full text-left p-3 hover:bg-gray-50"
                              >
                                <p className="text-sm font-medium text-gray-900">
                                  {c.firstName} {c.lastName}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {c.phone || c.email || c.occupation || ""}
                                </p>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="p-3 text-center">
                            <p className="text-xs text-gray-500 mb-2">Escribí para buscar</p>
                            <button
                              type="button"
                              onClick={() => setIsCreateCustomerOpen(true)}
                              className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-700"
                            >
                              Crear cliente nuevo
                            </button>
                          </div>
                        )}
                      </div>

                      <p className="text-xs text-gray-500 text-center">
                        El cliente es opcional. Podés continuar sin asignar.
                      </p>
                    </>
                  )}
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs">
                  {error}
                </div>
              )}

              {/* Botones */}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={handleClose} disabled={isProcessing} className="flex-1">
                  Cancelar
                </Button>
                <Button onClick={handleComplete} disabled={!canComplete || isProcessing} className="flex-1">
                  {isProcessing ? "Procesando..." : "Confirmar"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal: crear cliente */}
      <CustomerFormModal
        isOpen={isCreateCustomerOpen}
        onClose={() => setIsCreateCustomerOpen(false)}
        customer={null}
        onSaved={() => {
          setIsCreateCustomerOpen(false);
          setCustomerSearch("");
          setCustomerResults([]);
        }}
        onSavedCustomer={(c) => {
          setSelectedCustomer(c);
          setActiveTab("payment");
        }}
      />
    </>
  );
}