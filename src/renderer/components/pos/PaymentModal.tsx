// src/renderer/components/pos/PaymentModal.tsx
import { useState, useEffect } from "react";
import {
  Banknote,
  ArrowLeftRight,
  CheckCircle,
  Printer,
  Download,
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
import { useCartStore, groupFill, effectivePrice, lineSubtotal } from '@/renderer/stores/cart.stores';
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
  { id: "cash", label: "Efectivo", icon: Banknote, color: "bg-primary" },
  { id: "transfer", label: "Transferencia", icon: ArrowLeftRight, color: "bg-brand-orange" },
];

type TabType = "payment" | "customer";

export function PaymentModal({ open, onOpenChange }: PaymentModalProps) {
  const { items, subtotal, discount, total, clearCart } = useCartStore();

  // El precio de cada línea depende de si su pack quedó completo.
  const fill = groupFill(items);

  // Tab activo
  const [activeTab, setActiveTab] = useState<TabType>("payment");

  // Cliente (opcional)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerResults, setCustomerResults] = useState<Customer[]>([]);
  const [isCustomerLoading, setIsCustomerLoading] = useState(false);
  const [isCreateCustomerOpen, setIsCreateCustomerOpen] = useState(false);

  // Pago simple
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("cash");
  const [cashReceived, setCashReceived] = useState("");

  // Pago mixto

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

      setSelectedMethod("cash");
      setCashReceived("");
      setSaleCompleted(false);
      setCompletedSaleId(null);
      setError(null);
    }
  }, [open]);

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

  const formatMoney = (amount: number) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(amount);

  // Sólo el pago en efectivo exige que lo recibido cubra el total
  const canComplete =
    selectedMethod !== "cash" || (cashReceivedNum >= total && total > 0);

  const handleComplete = async () => {
    if (!canComplete || items.length === 0) return;

    setIsProcessing(true);
    setError(null);

    try {
      const saleData = {
        customerId: selectedCustomer?.id,
        subtotal,
        tax: 0,
        discount,
        total,
        paymentMethod: selectedMethod,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: effectivePrice(item, fill),
          discount: 0,
          subtotal: lineSubtotal(item, fill),
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
          price: effectivePrice(item, fill),
          subtotal: lineSubtotal(item, fill),
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
          price: effectivePrice(item, fill),
          subtotal: lineSubtotal(item, fill),
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
                <div className="w-14 h-14 bg-brand-green/25 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-8 h-8 text-brand-green-ink" />
                </div>
                <p className="text-2xl font-bold text-brand-green-ink">{formatMoney(total)}</p>
                <p className="text-muted-foreground text-sm">Venta #{completedSaleId?.toString().padStart(6, "0")}</p>

                {selectedCustomer && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Cliente: {selectedCustomer.firstName} {selectedCustomer.lastName}
                  </p>
                )}

                {selectedMethod === "cash" && change > 0 && (
                  <div className="mt-3 p-2 bg-brand-yellow/15 rounded-lg">
                    <p className="text-xs text-brand-dark">Cambio a entregar:</p>
                    <p className="text-lg font-bold text-brand-dark">{formatMoney(change)}</p>
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
                  <p className="text-xs text-brand-green-ink">Descuento: -{formatMoney(discount)}</p>
                )}
                {selectedCustomer && (
                  <p className="text-xs text-brand-orange-ink mt-1">
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
                      : "border-transparent text-muted-foreground hover:text-foreground"
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
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <User className="w-4 h-4" />
                  Cliente
                  {selectedCustomer && <span className="w-2 h-2 bg-primary rounded-full"></span>}
                </button>
              </div>

              {/* Tab Content */}
              {activeTab === "payment" ? (
                /* TAB PAGO */
                <div className="space-y-4">
                      {/* Métodos de pago simple */}
                      <div className="grid grid-cols-2 gap-2">
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
                                  : "border-border hover:border-input"
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
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                              <input
                                type="number"
                                value={cashReceived}
                                onChange={(e) => setCashReceived(e.target.value)}
                                placeholder="0.00"
                                step="0.01"
                                min="0"
                                autoFocus
                                className="w-full pl-8 pr-4 py-2 border border-input rounded-lg text-lg font-semibold text-foreground bg-card"
                              />
                            </div>
                          </div>

                          {cashReceivedNum > 0 && (
                            <div className={`p-2 rounded-lg text-sm ${change >= 0 ? "bg-brand-green/10 text-brand-green-ink" : "bg-destructive/10 text-destructive"}`}>
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
                                className="px-2 py-1 bg-secondary hover:bg-secondary rounded text-xs text-muted-foreground"
                              >
                                ${amount}
                              </button>
                            ))}
                            <button
                              type="button"
                              onClick={() => setCashReceived(Math.ceil(total).toString())}
                              className="px-2 py-1 bg-brand-green/25 hover:bg-brand-green/40 text-brand-green-ink rounded text-xs"
                            >
                              Exacto
                            </button>
                          </div>
                        </div>
                      )}
                </div>
              ) : (
                /* TAB CLIENTE */
                <div className="space-y-3">
                  {selectedCustomer ? (
                    <div className="p-3 rounded-lg bg-brand-green/10 border border-primary/30">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-foreground">
                            {selectedCustomer.firstName} {selectedCustomer.lastName}
                          </p>
                          {selectedCustomer.phone && (
                            <p className="text-xs text-muted-foreground">{selectedCustomer.phone}</p>
                          )}
                          {selectedCustomer.email && (
                            <p className="text-xs text-muted-foreground">{selectedCustomer.email}</p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCustomer(null);
                            setCustomerSearch("");
                            setCustomerResults([]);
                          }}
                          className="text-xs text-destructive hover:text-destructive"
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
                        className="w-full px-3 py-2 border border-input rounded-lg text-sm text-foreground bg-card"
                        autoFocus
                      />

                      <div className="border rounded-lg overflow-hidden bg-card max-h-48 overflow-y-auto">
                        {isCustomerLoading ? (
                          <div className="p-3 text-sm text-muted-foreground">Buscando...</div>
                        ) : customerSearch.trim() && customerResults.length === 0 ? (
                          <div className="p-3 text-center">
                            <p className="text-sm text-muted-foreground mb-2">Sin resultados</p>
                            <button
                              type="button"
                              onClick={() => setIsCreateCustomerOpen(true)}
                              className="text-sm px-3 py-1.5 rounded-lg bg-brand-orange text-white hover:opacity-90"
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
                                className="w-full text-left p-3 hover:bg-accent"
                              >
                                <p className="text-sm font-medium text-foreground">
                                  {c.firstName} {c.lastName}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {c.phone || c.email || c.occupation || ""}
                                </p>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="p-3 text-center">
                            <p className="text-xs text-muted-foreground mb-2">Escribí para buscar</p>
                            <button
                              type="button"
                              onClick={() => setIsCreateCustomerOpen(true)}
                              className="text-sm px-3 py-1.5 rounded-lg border border-input hover:bg-accent text-foreground"
                            >
                              Crear cliente nuevo
                            </button>
                          </div>
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground text-center">
                        El cliente es opcional. Podés continuar sin asignar.
                      </p>
                    </>
                  )}
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="bg-destructive/10 border border-destructive/30 text-destructive px-3 py-2 rounded-lg text-xs">
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