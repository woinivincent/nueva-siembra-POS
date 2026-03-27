// src/pages/POSPage.tsx
import { useState } from 'react';
import { Search } from 'lucide-react';
import { ProductGrid } from '@/renderer/components/pos/ProductGrid';
import { Cart } from '@/renderer/components/pos/Cart';
import { QuickAccessButtons } from '@/renderer/components/pos/QuickAccessButtons';
import { Button } from '@/renderer/components/ui/button';

const categories = [
  { id: 'all', label: 'Todos' },
  { id: 'Ensaladas', label: 'Ensaladas' },
  { id: 'Bowls', label: 'Bowls' },
  { id: 'Bebidas', label: 'Bebidas' },
  { id: 'Wraps', label: 'Wraps' },
];

export function POSPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b bg-card p-4 space-y-4">
        <div className="flex items-center gap-4">
          {/* Búsqueda */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por nombre o escanear código de barras..."
              className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        {/* Categorías */}
        <div className="flex gap-2">
          {categories.map(category => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.label}
            </Button>
          ))}
        </div>

        {/* Accesos Rápidos */}
        <QuickAccessButtons />
      </div>

      {/* Contenido Principal */}
      <div className="flex-1 flex overflow-hidden">
        {/* Grid de Productos */}
        <div className="flex-1 overflow-y-auto p-6">
          <ProductGrid 
            searchTerm={searchTerm} 
            selectedCategory={selectedCategory}
          />
        </div>

        {/* Carrito */}
        <div className="w-96 border-l bg-card">
          <Cart />
        </div>
      </div>
    </div>
  );
}