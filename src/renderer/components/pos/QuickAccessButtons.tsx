// src/renderer/components/pos/QuickAccessButtons.tsx
import { useEffect, useState } from 'react';
import { Button } from '@/renderer/components/ui/button';
import { useCartStore } from '@/renderer/stores/cart.stores';
import type { Product } from '@/shared/types/electron';

export function QuickAccessButtons() {
  const [favorites, setFavorites] = useState<Product[]>([]);
  const addItem = useCartStore(state => state.addItem);

  useEffect(() => {
    loadFavorites();
  }, []);

  async function loadFavorites() {
    try {
      const data = await window.electronAPI.products.getFavorites();
      console.log('Favoritos recibidos:', data); // Debug
      // Asegurarse que sea un array
      setFavorites(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading favorites:', error);
      setFavorites([]);
    }
  }

  const favoriteKeys = ['F1', 'F2', 'F3', 'F4', 'F5', 'F6'];

  return (
    <div className="grid grid-cols-6 gap-2">
      {favoriteKeys.map(key => {
        const product = favorites.find(p => p.favoriteKey === key);
        
        return (
          <Button
            key={key}
            variant={product ? 'default' : 'outline'}
            className="h-16 flex flex-col items-center justify-center"
            disabled={!product}
            onClick={() => {
              // Los accesos rápidos cargan el producto suelto; para armar un
              // pack se toca el producto en la grilla y se elige el tamaño.
              if (product) addItem(product, 'unit');
            }}
          >
            <span className="text-xs font-semibold">{key}</span>
            {product && (
              <span className="text-xs truncate w-full text-center">
                {product.name}
              </span>
            )}
          </Button>
        );
      })}
    </div>
  );
}