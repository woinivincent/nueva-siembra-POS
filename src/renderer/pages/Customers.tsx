// src/renderer/pages/Customers.tsx
import { useEffect, useState } from 'react';
import { Plus, Search, Users } from 'lucide-react';
import { CustomersTable } from '../components/customers/CustomersTable';
import { CustomerFormModal } from '../components/customers/CustomersFormModal';
import { CustomerDetailModal } from '../components/customers/CustomersDetailModal';
import { BirthdayAlert } from '../components/customers/BirthdayAlert';
import type { Customer } from '@/shared/types/electron';

export function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [birthdayCustomers, setBirthdayCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    loadCustomers();
    loadBirthdays();
  }, []);

  async function loadCustomers() {
    setIsLoading(true);
    try {
      let data: Customer[];
      
      if (searchTerm) {
        data = await window.electronAPI.customers.search(searchTerm);
      } else {
        data = await window.electronAPI.customers.getAll();
      }
      
      setCustomers(data);
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadBirthdays() {
    try {
      const birthdays = await window.electronAPI.customers.getTodayBirthdays();
      setBirthdayCustomers(birthdays);
    } catch (error) {
      console.error('Error loading birthdays:', error);
    }
  }

  useEffect(() => {
    const debounce = setTimeout(() => {
      loadCustomers();
    }, 300);
    return () => clearTimeout(debounce);
  }, [searchTerm]);

  function handleEdit(customer: Customer) {
    setEditingCustomer(customer);
    setShowFormModal(true);
  }

  function handleViewDetail(customer: Customer) {
    setSelectedCustomer(customer);
    setShowDetailModal(true);
  }

  async function handleDelete(customer: Customer) {
    if (!confirm(`¿Eliminar a "${customer.fullName}"?`)) return;
    
    try {
      await window.electronAPI.customers.delete(customer.id);
      loadCustomers();
    } catch (error) {
      console.error('Error deleting customer:', error);
      alert('Error al eliminar el cliente');
    }
  }

  function handleFormModalClose() {
    setShowFormModal(false);
    setEditingCustomer(null);
  }

  function handleCustomerSaved() {
    handleFormModalClose();
    loadCustomers();
    loadBirthdays();
  }

  return (
    <div className="p-6 space-y-6">
      {/* Alerta de cumpleaños */}
      {birthdayCustomers.length > 0 && (
        <BirthdayAlert customers={birthdayCustomers} />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Clientes</h1>
          <p className="text-muted-foreground">{customers.length} clientes registrados</p>
        </div>
        
        <button
          onClick={() => setShowFormModal(true)}
          className="px-4 py-2 bg-brand-orange text-white rounded-lg hover:opacity-90 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Nuevo Cliente
        </button>
      </div>

      {/* Búsqueda */}
      <div className="bg-card rounded-xl shadow p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por nombre, teléfono o profesión..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border text-foreground border-input rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-brand-orange"
          />
        </div>
      </div>

      {/* Tabla de clientes */}
      {isLoading ? (
        <div className="bg-card rounded-xl shadow p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-orange"></div>
            <span className="ml-3 text-muted-foreground">Cargando clientes...</span>
          </div>
        </div>
      ) : customers.length === 0 ? (
        <div className="bg-card rounded-xl shadow p-12 text-center">
          <Users className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No hay clientes</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm
              ? 'No se encontraron clientes con ese criterio'
              : 'Comenzá agregando tu primer cliente'}
          </p>
          {!searchTerm && (
            <button
              onClick={() => setShowFormModal(true)}
              className="px-4 py-2 bg-brand-orange text-white rounded-lg hover:opacity-90"
            >
              Agregar Cliente
            </button>
          )}
        </div>
      ) : (
        <CustomersTable
          customers={customers}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onViewDetail={handleViewDetail}
        />
      )}

      {/* Modales */}
      <CustomerFormModal
        isOpen={showFormModal}
        onClose={handleFormModalClose}
        onSaved={handleCustomerSaved}
        customer={editingCustomer}
      />

      <CustomerDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        customer={selectedCustomer}
      />
    </div>
  );
}