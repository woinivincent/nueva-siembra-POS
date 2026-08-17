// src/pages/POSPage.tsx
import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { ProductGrid } from '@/renderer/components/pos/ProductGrid';
import { Cart } from '@/renderer/components/pos/Cart';
import { Button } from '@/renderer/components/ui/button';

export function POSPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  // Las categorías salen del inventario, así que acompañan lo que haya cargado
  const [categories, setCategories] = useState([{ id: 'all', label: 'Todos' }]);

  useEffect(() => {
    window.electronAPI.products
      .getCategories()
      .then((names) =>
        setCategories([
          { id: 'all', label: 'Todos' },
          ...names.map((name) => ({ id: name, label: name })),
        ]),
      )
      .catch((error) => console.error('Error loading categories:', error));
  }, []);

  return (
    // El carrito es una columna propia de alto completo: arranca arriba de
    // todo, al lado del buscador, y no debajo como estaba antes.
    <div className="h-screen flex">
      {/* Columna izquierda: buscador, categorías y grilla */}
      <div className="flex-1 flex flex-col overflow-hidden">
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
      </div>

        {/* Grid de Productos */}
        <div className="flex-1 overflow-y-auto sin-scrollbar p-6">
          <ProductGrid
            searchTerm={searchTerm}
            selectedCategory={selectedCategory}
          />
        </div>
      </div>

      {/* Carrito: mismo ancho que antes, pero de alto completo */}
      <div className="w-96 border-l bg-card">
        <Cart />
      </div>
    </div>
  );
}