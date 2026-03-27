// src/renderer/components/pos/ProductGrid.tsx
import { useEffect, useState } from 'react';
import { ProductCard } from './ProductCard';
import type { Product } from '@/shared/types/electron';
import { useCartStore } from '@/renderer/stores/cart.stores';

interface ProductGridProps {
  searchTerm: string;
  selectedCategory: string;
}

export function ProductGrid({ searchTerm, selectedCategory }: ProductGridProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const addItem = useCartStore(state => state.addItem);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    try {
      const data = await window.electronAPI.products.getAll();
      console.log('Productos recibidos:', data); // Debug
      // Asegurarse que sea un array
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.barcode?.includes(searchTerm);
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Cargando productos...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {filteredProducts.map(product => (
        <ProductCard
          key={product.id}
          product={product}
          onAddToCart={() => addItem({
            id: product.id,
            name: product.name,
            price: product.price,
            unit: product.unit,
            priceCard:product.priceCard
          })}
        />
      ))}
      
      {filteredProducts.length === 0 && (
        <div className="col-span-full text-center py-12">
          <p className="text-muted-foreground">No se encontraron productos</p>
        </div>
      )}
    </div>
  );
}