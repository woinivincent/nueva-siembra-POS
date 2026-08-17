// src/renderer/pages/Suppliers.tsx
import { useEffect, useState } from 'react';
import { Plus, Search, Truck, Filter } from 'lucide-react';
import { SuppliersTable } from '../components/suppliers/SuppliersTables';
import { SupplierFormModal } from '../components/suppliers/SupplierFormModal';
import type { Supplier } from '@/shared/types/electron';

export function Suppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  useEffect(() => {
    loadSuppliers();
    loadCategories();
  }, []);

  async function loadSuppliers() {
    setIsLoading(true);
    try {
      let data: Supplier[];
      
      if (searchTerm) {
        data = await window.electronAPI.suppliers.search(searchTerm);
      } else {
        data = await window.electronAPI.suppliers.getAll();
      }

      if (selectedCategory !== 'all') {
        data = data.filter(s => s.category === selectedCategory);
      }
      
      setSuppliers(data);
    } catch (error) {
      console.error('Error loading suppliers:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadCategories() {
    try {
      const cats = await window.electronAPI.suppliers.getCategories();
      setCategories(cats);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  }

  useEffect(() => {
    const debounce = setTimeout(() => {
      loadSuppliers();
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchTerm, selectedCategory]);

  function handleEdit(supplier: Supplier) {
    setEditingSupplier(supplier);
    setShowModal(true);
  }

  async function handleDelete(supplier: Supplier) {
    if (!confirm(`¿Eliminar a "${supplier.companyName}"?`)) return;
    
    try {
      await window.electronAPI.suppliers.delete(supplier.id);
      loadSuppliers();
    } catch (error) {
      console.error('Error deleting supplier:', error);
      alert('Error al eliminar el proveedor');
    }
  }

  function handleModalClose() {
    setShowModal(false);
    setEditingSupplier(null);
  }

  function handleSupplierSaved() {
    handleModalClose();
    loadSuppliers();
    loadCategories();
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Proveedores</h1>
          <p className="text-gray-500">{suppliers.length} proveedores registrados</p>
        </div>
        
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Nuevo Proveedor
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Búsqueda */}
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, contacto o teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-gray-800 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          {/* Filtro categoría */}
          {categories.length > 0 && (
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="all">Todas las categorías</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Tabla */}
      {isLoading ? (
        <div className="bg-white rounded-xl shadow p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <span className="ml-3 text-gray-500">Cargando proveedores...</span>
          </div>
        </div>
      ) : suppliers.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-12 text-center">
          <Truck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">No hay proveedores</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || selectedCategory !== 'all'
              ? 'No se encontraron proveedores con ese criterio'
              : 'Comenzá agregando tu primer proveedor'}
          </p>
          {!searchTerm && selectedCategory === 'all' && (
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Agregar Proveedor
            </button>
          )}
        </div>
      ) : (
        <SuppliersTable
          suppliers={suppliers}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {/* Modal */}
      <SupplierFormModal
        isOpen={showModal}
        onClose={handleModalClose}
        onSaved={handleSupplierSaved}
        supplier={editingSupplier}
        categories={categories}
      />
    </div>
  );
}