// src/renderer/stores/cart.stores.ts
import { create } from 'zustand';

export interface CartItem {
  productId: number;
  name: string;
  price: number;      // Precio efectivo
  priceCard: number;  // Precio tarjeta
  quantity: number;
  unit: 'ud' | 'kg';
  subtotal: number;
}

export type DiscountType = 'none' | 'percentage' | 'fixed';
export type PriceListType = 'cash' | 'card';

interface CartState {
  items: CartItem[];
  discountType: DiscountType;
  discountValue: number;
  priceList: PriceListType; // Lista de precios activa
  subtotal: number;
  discount: number;
  total: number;
  
  // Actions
  addItem: (product: { id: number; name: string; price: number; priceCard: number; unit: 'ud' | 'kg' }) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  setDiscount: (type: DiscountType, value: number) => void;
  clearDiscount: () => void;
  setPriceList: (list: PriceListType) => void;
  clearCart: () => void;
}

// Función para recalcular totales
function calculateTotals(items: CartItem[], discountType: DiscountType, discountValue: number, priceList: PriceListType) {
  // Calcular subtotal según lista de precios
  const subtotal = items.reduce((sum, item) => {
    const price = priceList === 'cash' ? item.price : item.priceCard;
    return sum + (price * item.quantity);
  }, 0);
  
  let discount = 0;
  if (discountType === 'percentage' && discountValue > 0) {
    discount = subtotal * (discountValue / 100);
  } else if (discountType === 'fixed' && discountValue > 0) {
    discount = Math.min(discountValue, subtotal);
  }
  
  const total = subtotal - discount;
  
  return { subtotal, discount, total: Math.max(0, total) };
}

// Actualizar subtotales de items según lista de precios
function updateItemSubtotals(items: CartItem[], priceList: PriceListType): CartItem[] {
  return items.map(item => ({
    ...item,
    subtotal: (priceList === 'cash' ? item.price : item.priceCard) * item.quantity
  }));
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  discountType: 'none',
  discountValue: 0,
  priceList: 'cash', // Por defecto efectivo
  subtotal: 0,
  discount: 0,
  total: 0,
  
  addItem: (product) => {
    const { items, discountType, discountValue, priceList } = get();
    const existingItem = items.find(item => item.productId === product.id);
    
    let newItems: CartItem[];
    
    if (existingItem) {
      newItems = items.map(item =>
        item.productId === product.id
          ? {
              ...item,
              quantity: item.quantity + 1,
              subtotal: (priceList === 'cash' ? item.price : item.priceCard) * (item.quantity + 1),
            }
          : item
      );
    } else {
      const price = priceList === 'cash' ? product.price : product.priceCard;
      newItems = [
        ...items,
        {
          productId: product.id,
          name: product.name,
          price: product.price,
          priceCard: product.priceCard,
          quantity: 1,
          unit: product.unit,
          subtotal: price,
        },
      ];
    }
    
    set({
      items: newItems,
      ...calculateTotals(newItems, discountType, discountValue, priceList),
    });
  },
  
  removeItem: (productId) => {
    const { items, discountType, discountValue, priceList } = get();
    const newItems = items.filter(item => item.productId !== productId);
    
    set({
      items: newItems,
      ...calculateTotals(newItems, discountType, discountValue, priceList),
    });
  },
  
  updateQuantity: (productId, quantity) => {
    const { items, discountType, discountValue, priceList } = get();
    
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }
    
    const newItems = items.map(item =>
      item.productId === productId
        ? {
            ...item,
            quantity,
            subtotal: (priceList === 'cash' ? item.price : item.priceCard) * quantity,
          }
        : item
    );
    
    set({
      items: newItems,
      ...calculateTotals(newItems, discountType, discountValue, priceList),
    });
  },
  
  setDiscount: (type, value) => {
    const { items, priceList } = get();
    
    set({
      discountType: type,
      discountValue: value,
      ...calculateTotals(items, type, value, priceList),
    });
  },
  
  clearDiscount: () => {
    const { items, priceList } = get();
    
    set({
      discountType: 'none',
      discountValue: 0,
      ...calculateTotals(items, 'none', 0, priceList),
    });
  },
  
  setPriceList: (list) => {
    const { items, discountType, discountValue } = get();
    
    // Actualizar subtotales de items con nueva lista de precios
    const updatedItems = updateItemSubtotals(items, list);
    
    set({
      priceList: list,
      items: updatedItems,
      ...calculateTotals(updatedItems, discountType, discountValue, list),
    });
  },
  
  clearCart: () => {
    set({
      items: [],
      discountType: 'none',
      discountValue: 0,
      priceList: 'cash',
      subtotal: 0,
      discount: 0,
      total: 0,
    });
  },
}));