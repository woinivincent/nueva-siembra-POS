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
    <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group">
      <div className="aspect-square bg-muted relative overflow-hidden">
        {product.image ? (
          <img 
            src={product.image} 
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-16 h-16 text-muted-foreground/50" />
          </div>
        )}
        
        {/* Badge de stock bajo */}
        {isLowStock && (
          <div className="absolute top-2 right-2 bg-destructive text-destructive-foreground text-xs px-2 py-1 rounded">
            Stock Bajo
          </div>
        )}
        
        {/* Badge de favorito */}
        {product.favoriteKey && (
          <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded font-semibold">
            {product.favoriteKey}
          </div>
        )}
      </div>
      
      <div className="p-4 space-y-2">
        <div>
          <h3 className="font-semibold text-sm line-clamp-1">{product.name}</h3>
          <p className="text-xs text-muted-foreground">{product.category}</p>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-bold text-primary">${product.price.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Stock: {product.stock}</p>
          </div>
          
          <Button 
            size="icon" 
            onClick={onAddToCart}
            disabled={product.stock <= 0}
            className="rounded-full"
          >
            <ShoppingCart className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}