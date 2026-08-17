// src/renderer/components/pos/Cart.tsx
import { useState } from "react";
import {
  Minus,
  Plus,
  Trash2,
  ShoppingCart,
  Percent,
  DollarSign,
  X,
} from "lucide-react";

import { Button } from "@/renderer/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/renderer/components/ui/card";
import { useCartStore, groupFill, effectivePrice, lineSubtotal, type CartItem, type DiscountType } from '@/renderer/stores/cart.stores';
import { PaymentModal } from "./PaymentModal";

interface CartProps {
  onCheckout?: () => void;
}

export function Cart({ onCheckout }: CartProps) {
  const {
    items,
    subtotal,
    discount,
    total,
    discountType,
    discountValue,
    updateQuantity,
    removeItem,
    clearCart,
    setDiscount,
    clearDiscount,
  } = useCartStore();

  // Cuánto lleva cargado cada pack: define si ya se cobra a precio de pack
  // o si todavía va a precio unidad por estar incompleto.
  const fill = groupFill(items);

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  // Descuento UI
  const [showDiscountInput, setShowDiscountInput] = useState(false);
  const [tempDiscountType, setTempDiscountType] =
    useState<DiscountType>("percentage");
  const [tempDiscountValue, setTempDiscountValue] = useState("");

  const formatMoney = (amount: number) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(amount);

  const stepForUnit = (unit: "ud" | "kg") => (unit === "kg" ? 0.1 : 1);

  const safeUpdateQty = (lineId: string, nextQty: number) => {
    const qty = Math.max(0, Number(nextQty.toFixed(4)));
    updateQuantity(lineId, qty);
  };

  const handleApplyDiscount = () => {
    const value = parseFloat(tempDiscountValue);

    if (Number.isNaN(value) || value <= 0) {
      alert("Ingresá un valor válido");
      return;
    }

    if (tempDiscountType === "percentage" && value > 100) {
      alert("El porcentaje no puede ser mayor a 100%");
      return;
    }

    setDiscount(tempDiscountType, value);
    setShowDiscountInput(false);
    setTempDiscountValue("");
  };

  const handleRemoveDiscount = () => {
    clearDiscount();
    setShowDiscountInput(false);
    setTempDiscountValue("");
  };

  const handleCheckoutClick = () => {
    if (onCheckout) return onCheckout();
    setPaymentModalOpen(true);
  };

  // Las líneas se muestran agrupadas por pack, respetando el orden de carga.
  type Block =
    | { kind: "pack"; groupId: string; size: number; filled: number; complete: boolean; items: CartItem[] }
    | { kind: "single"; item: CartItem };

  const blocks: Block[] = [];
  const packIndex = new Map<string, number>();

  for (const item of items) {
    if (!item.packGroupId || !item.packSize) {
      blocks.push({ kind: "single", item });
      continue;
    }

    const existing = packIndex.get(item.packGroupId);
    if (existing !== undefined) {
      (blocks[existing] as Extract<Block, { kind: "pack" }>).items.push(item);
      continue;
    }

    const filled = fill.get(item.packGroupId) ?? 0;
    packIndex.set(item.packGroupId, blocks.length);
    blocks.push({
      kind: "pack",
      groupId: item.packGroupId,
      size: item.packSize,
      filled,
      complete: filled >= item.packSize,
      items: [item],
    });
  }

  const renderLine = (item: CartItem) => {
    const step = stepForUnit(item.unit);
    const isKg = item.unit === "kg";
    const price = effectivePrice(item, fill);

    return (
      <div key={item.id} className="bg-secondary rounded-lg p-3 space-y-2">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="font-medium text-sm">{item.name}</p>
            <p className="text-xs text-muted-foreground">
              {formatMoney(price)} {isKg ? "/ kg" : "c/u"}
            </p>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={() => removeItem(item.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => safeUpdateQty(item.id, item.quantity - step)}
            >
              <Minus className="w-3 h-3" />
            </Button>

            <span className="text-sm font-semibold min-w-[3rem] text-center">
              {isKg ? item.quantity.toFixed(2) : item.quantity}
            </span>

            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => safeUpdateQty(item.id, item.quantity + step)}
            >
              <Plus className="w-3 h-3" />
            </Button>
          </div>

          <p className="font-bold text-primary">
            {formatMoney(lineSubtotal(item, fill))}
          </p>
        </div>
      </div>
    );
  };

  return (
    <>
      <Card className="h-full flex flex-col">
        <CardHeader className="border-b pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Carrito ({items.length})
            </CardTitle>

            {items.length > 0 && (
              <button
                type="button"
                onClick={clearCart}
                className="text-sm text-destructive hover:underline"
              >
                Vaciar
              </button>
            )}
          </div>

        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <ShoppingCart className="w-16 h-16 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">El carrito está vacío</p>
              <p className="text-sm text-muted-foreground">
                Agrega productos para comenzar
              </p>
            </div>
          ) : (
            <>
              {blocks.map((block) =>
                block.kind === "pack" ? (
                  <div
                    key={block.groupId}
                    className={`rounded-lg border-2 p-2 space-y-2 ${
                      block.complete
                        ? "border-brand-green bg-brand-green/10"
                        : "border-brand-yellow bg-brand-yellow/15"
                    }`}
                  >
                    <div className="flex items-center justify-between px-1">
                      <span className="text-xs font-semibold uppercase tracking-wide">
                        Pack x{block.size}
                      </span>
                      <span
                        className={`text-xs font-medium ${
                          block.complete ? "text-brand-green" : "text-brand-orange"
                        }`}
                      >
                        {block.complete
                          ? "completo"
                          : `faltan ${block.size - block.filled} · va a precio unidad`}
                      </span>
                    </div>
                    {block.items.map(renderLine)}
                  </div>
                ) : (
                  renderLine(block.item)
                ),
              )}
            </>
          )}
        </CardContent>

        {items.length > 0 && (
          <div className="border-t p-4 space-y-3">
            {/* Resumen */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-medium">{formatMoney(subtotal)}</span>
              </div>

              {/* Descuento */}
              {discountType !== "none" && discount > 0 ? (
                <div className="flex justify-between items-center text-brand-green-ink">
                  <div className="flex items-center gap-2">
                    <span>
                      Descuento{" "}
                      {discountType === "percentage"
                        ? `(${discountValue}%)`
                        : "(Fijo)"}
                      :
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={handleRemoveDiscount}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <span className="font-medium">-{formatMoney(discount)}</span>
                </div>
              ) : showDiscountInput ? (
                <div className="bg-secondary rounded-lg p-3 space-y-3">
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={
                        tempDiscountType === "percentage"
                          ? "default"
                          : "outline"
                      }
                      className="flex-1 gap-2"
                      onClick={() => setTempDiscountType("percentage")}
                    >
                      <Percent className="w-4 h-4" />
                      Porcentaje
                    </Button>
                    <Button
                      type="button"
                      variant={
                        tempDiscountType === "fixed" ? "default" : "outline"
                      }
                      className="flex-1 gap-2"
                      onClick={() => setTempDiscountType("fixed")}
                    >
                      <DollarSign className="w-4 h-4" />
                      Monto fijo
                    </Button>
                  </div>

                  <div className="relative">
                    {tempDiscountType === "percentage" ? (
                      <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    ) : (
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    )}

                    <input
                      type="number"
                      value={tempDiscountValue}
                      onChange={(e) => setTempDiscountValue(e.target.value)}
                      placeholder={
                        tempDiscountType === "percentage" ? "0-100" : "0"
                      }
                      min={0}
                      max={tempDiscountType === "percentage" ? 100 : undefined}
                      step={tempDiscountType === "percentage" ? 1 : 0.01}
                      className={`w-full h-10 rounded-md text-foreground border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring  ${
                        tempDiscountType === "percentage" ? "pr-10" : "pl-10"
                      }`}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setShowDiscountInput(false);
                        setTempDiscountValue("");
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="button"
                      className="flex-1"
                      onClick={handleApplyDiscount}
                    >
                      Aplicar
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-center gap-2 h-[31px]"
                  onClick={() => setShowDiscountInput(true)}
                >
                  <Percent className="w-4 h-4" />
                  Agregar descuento
                </Button>
              )}

              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span>Total:</span>
                <span className="text-primary">{formatMoney(total)}</span>
              </div>
            </div>

            {/* Botones */}
            <div className="space-y-2">
              <Button
                type="button"
                className="w-full"
                size="lg"
                onClick={handleCheckoutClick}
              >
                Cobrar {formatMoney(total)}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={clearCart}
              >
                Limpiar carrito
              </Button>
            </div>
          </div>
        )}
      </Card>

      {paymentModalOpen && (
        <PaymentModal
          open={paymentModalOpen}
          onOpenChange={setPaymentModalOpen}
        />
      )}
    </>
  );
}