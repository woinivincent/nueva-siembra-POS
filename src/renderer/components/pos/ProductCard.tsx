// src/components/pos/ProductCard.tsx
import { Package, ShoppingCart } from 'lucide-react';
import { Button } from '@/renderer/components/ui/button';
import { Card } from '@/renderer/components/ui/card';
import type { Product } from '@/shared/types/electron';

interface ProductCardProps {
  product: Product;
  onAddToCart: () => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const isLowStock = product.stock <= (product.stockMin ?? 0);
  
  return (
    <Card
      onClick={product.stock > 0 ? onAddToCart : undefined}
      className={`overflow-hidden hover:shadow-lg transition-shadow group ${
        product.stock > 0 ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'
      }`}
    >
      {/*
        Sin imagen cargada se usa una franja baja en vez del recuadro grande:
        en un monitor de 768 px de alto eso es la diferencia entre ver dos
        productos o ver seis.
      */}
      <div
        className={`bg-muted relative overflow-hidden ${
          product.image ? 'aspect-[4/3]' : 'h-12'
        }`}
      >
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-6 h-6 text-muted-foreground/40" />
          </div>
        )}

        {/* Badge de stock bajo */}
        {isLowStock && (
          <div className="absolute top-1 right-1 bg-destructive text-destructive-foreground text-xs px-2 py-0.5 rounded">
            Stock Bajo
          </div>
        )}
      </div>
      
      <div className="p-4 space-y-2">
        <div>
          <h3 className="font-semibold text-sm line-clamp-2 min-h-[2.8rem] break-words">{product.name}</h3>
          <p className="text-xs text-muted-foreground">{product.category}</p>
        </div>
        
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-base font-bold text-brand-green-ink">${product.price.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Stock: {product.stock}</p>
          </div>
          
          <Button
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart();
            }}
            disabled={product.stock <= 0}
            className="rounded-full flex-shrink-0"
          >
            <ShoppingCart className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}