// src/renderer/pages/Inventory.tsx
import { useEffect, useState } from 'react';
import { Plus, Search, AlertTriangle, Package, Filter } from 'lucide-react';
import { ProductsTable } from '../components/inventory/ProductsTable';
import { ProductFormModal } from '../components/inventory/ProductsFormModal';
import type { Product } from '@/shared/types/electron';

export function Inventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showLowStock, setShowLowStock] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  async function loadProducts() {
    setIsLoading(true);
    try {
      let data: Product[];
      
      if (showLowStock) {
        data = await window.electronAPI.products.getLowStock();
      } else if (searchTerm) {
        data = await window.electronAPI.products.search(searchTerm);
      } else if (selectedCategory !== 'all') {
        data = await window.electronAPI.products.getByCategory(selectedCategory);
      } else {
        data = await window.electronAPI.products.getAll();
      }
      
      setProducts(data);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadCategories() {
    try {
      const cats = await window.electronAPI.products.getCategories();
      setCategories(cats);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  }

  useEffect(() => {
    const debounce = setTimeout(() => {
      loadProducts();
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchTerm, selectedCategory, showLowStock]);

  function handleEdit(product: Product) {
    setEditingProduct(product);
    setShowModal(true);
  }

  async function handleDelete(product: Product) {
    if (!confirm(`¿Eliminar "${product.name}"?`)) return;
    
    try {
      await window.electronAPI.products.delete(product.id);
      loadProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Error al eliminar el producto');
    }
  }

  function handleModalClose() {
    setShowModal(false);
    setEditingProduct(null);
  }

  function handleProductSaved() {
    handleModalClose();
    loadProducts();
    loadCategories();
  }

  // Contar productos con stock bajo
  const lowStockCount = products.filter(p => p.stock <= (p.stockMin || 0)).length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Inventario</h1>
          <p className="text-muted-foreground">{products.length} productos</p>
        </div>
        
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Nuevo Producto
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-card rounded-xl shadow p-4">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Búsqueda */}
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por nombre, código o categoría..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border  text-black border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-primary"
            />
          </div>

          {/* Filtro categoría */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-muted-foreground" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-input   text-black rounded-lg focus:ring-2 focus:ring-ring focus:border-primary"
            >
              <option value="all">Todas las categorías</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Filtro stock bajo */}
          <button
            onClick={() => setShowLowStock(!showLowStock)}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
              showLowStock 
                ? 'bg-destructive/15 text-destructive border-2 border-destructive/40' 
                : 'bg-secondary text-muted-foreground hover:bg-secondary'
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
            Stock Bajo
            {lowStockCount > 0 && (
              <span className="bg-destructive text-white text-xs px-2 py-0.5 rounded-full">
                {lowStockCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Tabla de productos */}
      {isLoading ? (
        <div className="bg-card rounded-xl shadow p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3 text-muted-foreground">Cargando productos...</span>
          </div>
        </div>
      ) : products.length === 0 ? (
        <div className="bg-card rounded-xl shadow p-12 text-center">
          <Package className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No hay productos</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm || selectedCategory !== 'all' || showLowStock
              ? 'No se encontraron productos con los filtros aplicados'
              : 'Comenzá agregando tu primer producto'}
          </p>
          {!searchTerm && selectedCategory === 'all' && !showLowStock && (
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
            >
              Agregar Producto
            </button>
          )}
        </div>
      ) : (
        <ProductsTable
          products={products}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {/* Modal */}
      <ProductFormModal
        isOpen={showModal}
        onClose={handleModalClose}
        onSaved={handleProductSaved}
        product={editingProduct}
        categories={categories}
      />
    </div>
  );
}