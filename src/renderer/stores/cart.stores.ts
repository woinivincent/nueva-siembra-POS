// src/renderer/stores/cart.stores.ts
import { create } from 'zustand';
import type { PackSize } from '@/shared/packs';

/**
 * Una línea del carrito. Cada línea es un producto con su cantidad.
 *
 * Si la línea forma parte de un pack, lleva el tamaño del pack y el id del
 * grupo al que pertenece. Un mismo pack puede tener líneas de productos
 * distintos (2 viandas de milanesa + 1 tarta, por ejemplo): cada línea aporta
 * su propio precio de pack.
 */
export interface CartItem {
  /** Id de la línea, no del producto: el mismo producto puede estar en varios packs. */
  id: string;
  productId: number;
  name: string;
  /** Precio del producto vendido suelto. */
  unitPrice: number;
  /** Precio por unidad dentro del pack elegido. null si la línea es individual. */
  packPrice: number | null;
  packSize: PackSize | null;
  /** Agrupa las líneas que comparten un mismo pack. null si es individual. */
  packGroupId: string | null;
  quantity: number;
  unit: 'ud' | 'kg';
}

/** Cómo se carga un producto: suelto o dentro de un pack de N. */
export type AddMode = 'unit' | PackSize;

export interface PackGroupStatus {
  groupId: string;
  size: PackSize;
  /** Unidades ya cargadas en el pack. */
  filled: number;
  complete: boolean;
}

export type DiscountType = 'none' | 'percentage' | 'fixed';

interface AddableProduct {
  id: number;
  name: string;
  price: number;
  unit: 'ud' | 'kg';
  pricePack3: number | null;
  pricePack4: number | null;
  pricePack5: number | null;
  pricePack10: number | null;
}

interface CartState {
  items: CartItem[];
  discountType: DiscountType;
  discountValue: number;
  subtotal: number;
  discount: number;
  total: number;

  addItem: (product: AddableProduct, mode: AddMode) => void;
  removeItem: (lineId: string) => void;
  updateQuantity: (lineId: string, quantity: number) => void;
  setDiscount: (type: DiscountType, value: number) => void;
  clearDiscount: () => void;
  clearCart: () => void;

  /** Estado de cada pack abierto, para mostrarlo en el carrito. */
  packGroups: () => PackGroupStatus[];
  /** Packs que quedaron sin completar. Sus líneas se cobran a precio unidad. */
  incompletePacks: () => PackGroupStatus[];
}

function packPriceOf(product: AddableProduct, size: PackSize): number | null {
  switch (size) {
    case 3: return product.pricePack3;
    case 4: return product.pricePack4;
    case 5: return product.pricePack5;
    case 10: return product.pricePack10;
  }
}

/** Unidades cargadas en cada grupo de pack. */
export function groupFill(items: CartItem[]): Map<string, number> {
  const fill = new Map<string, number>();
  for (const item of items) {
    if (!item.packGroupId) continue;
    fill.set(item.packGroupId, (fill.get(item.packGroupId) ?? 0) + item.quantity);
  }
  return fill;
}

/**
 * Precio que finalmente se le cobra a una línea.
 *
 * Un pack incompleto no cobra precio de pack: sus líneas se recalculan a
 * precio unidad hasta que el pack se termine de armar.
 */
export function effectivePrice(item: CartItem, fill: Map<string, number>): number {
  if (!item.packGroupId || item.packPrice === null || item.packSize === null) {
    return item.unitPrice;
  }
  const filled = fill.get(item.packGroupId) ?? 0;
  return filled >= item.packSize ? item.packPrice : item.unitPrice;
}

export function lineSubtotal(item: CartItem, fill: Map<string, number>): number {
  return effectivePrice(item, fill) * item.quantity;
}

function calculateTotals(items: CartItem[], discountType: DiscountType, discountValue: number) {
  const fill = groupFill(items);
  const subtotal = items.reduce((sum, item) => sum + lineSubtotal(item, fill), 0);

  let discount = 0;
  if (discountType === 'percentage' && discountValue > 0) {
    discount = subtotal * (discountValue / 100);
  } else if (discountType === 'fixed' && discountValue > 0) {
    discount = Math.min(discountValue, subtotal);
  }

  return { subtotal, discount, total: Math.max(0, subtotal - discount) };
}

let groupCounter = 0;
let lineCounter = 0;

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  discountType: 'none',
  discountValue: 0,
  subtotal: 0,
  discount: 0,
  total: 0,

  addItem: (product, mode) => {
    const { items, discountType, discountValue } = get();
    let newItems: CartItem[];

    if (mode === 'unit') {
      // Suelto: se acumula con otra línea individual del mismo producto.
      const existing = items.find(
        (item) => item.productId === product.id && item.packGroupId === null,
      );
      newItems = existing
        ? items.map((item) =>
            item.id === existing.id ? { ...item, quantity: item.quantity + 1 } : item,
          )
        : [
            ...items,
            {
              id: `line-${++lineCounter}`,
              productId: product.id,
              name: product.name,
              unitPrice: product.price,
              packPrice: null,
              packSize: null,
              packGroupId: null,
              quantity: 1,
              unit: product.unit,
            },
          ];
    } else {
      const size = mode;
      const packPrice = packPriceOf(product, size);
      if (packPrice === null) return; // el producto no se vende en este pack

      // Buscar el último pack de este tamaño que todavía tenga lugar.
      const fill = groupFill(items);
      const openGroupId = [...new Set(
        items.filter((i) => i.packSize === size && i.packGroupId).map((i) => i.packGroupId!),
      )]
        .reverse()
        .find((id) => (fill.get(id) ?? 0) < size);

      const groupId = openGroupId ?? `pack-${size}-${++groupCounter}`;

      // Si el producto ya está en ese mismo pack, se suma a esa línea.
      const existing = items.find(
        (item) => item.productId === product.id && item.packGroupId === groupId,
      );

      newItems = existing
        ? items.map((item) =>
            item.id === existing.id ? { ...item, quantity: item.quantity + 1 } : item,
          )
        : [
            ...items,
            {
              id: `line-${++lineCounter}`,
              productId: product.id,
              name: product.name,
              unitPrice: product.price,
              packPrice,
              packSize: size,
              packGroupId: groupId,
              quantity: 1,
              unit: product.unit,
            },
          ];
    }

    set({ items: newItems, ...calculateTotals(newItems, discountType, discountValue) });
  },

  removeItem: (lineId) => {
    const { items, discountType, discountValue } = get();
    const newItems = items.filter((item) => item.id !== lineId);
    set({ items: newItems, ...calculateTotals(newItems, discountType, discountValue) });
  },

  updateQuantity: (lineId, quantity) => {
    const { items, discountType, discountValue } = get();

    if (quantity <= 0) {
      get().removeItem(lineId);
      return;
    }

    const newItems = items.map((item) =>
      item.id === lineId ? { ...item, quantity } : item,
    );
    set({ items: newItems, ...calculateTotals(newItems, discountType, discountValue) });
  },

  setDiscount: (type, value) => {
    const { items } = get();
    set({ discountType: type, discountValue: value, ...calculateTotals(items, type, value) });
  },

  clearDiscount: () => {
    const { items } = get();
    set({ discountType: 'none', discountValue: 0, ...calculateTotals(items, 'none', 0) });
  },

  clearCart: () => {
    set({
      items: [],
      discountType: 'none',
      discountValue: 0,
      subtotal: 0,
      discount: 0,
      total: 0,
    });
  },

  packGroups: () => {
    const { items } = get();
    const fill = groupFill(items);
    const seen = new Map<string, PackSize>();

    for (const item of items) {
      if (item.packGroupId && item.packSize) seen.set(item.packGroupId, item.packSize);
    }

    return [...seen.entries()].map(([groupId, size]) => {
      const filled = fill.get(groupId) ?? 0;
      return { groupId, size, filled, complete: filled >= size };
    });
  },

  incompletePacks: () => get().packGroups().filter((group) => !group.complete),
}));
