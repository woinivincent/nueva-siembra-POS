// src/renderer/components/customers/CustomerFormModal.tsx
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Customer } from '@/shared/types/electron';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  onSavedCustomer?: (customer: Customer) => void;
  customer: Customer | null;
}

export function CustomerFormModal({
  isOpen,
  onClose,
  onSaved,
  onSavedCustomer,
  customer,
}: Props) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    birthDate: '',
    occupation: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!customer;

  useEffect(() => {
    if (isOpen) {
      if (customer) {
        setFormData({
          firstName: customer.firstName,
          lastName: customer.lastName,
          phone: customer.phone || '',
          email: customer.email || '',
          birthDate: customer.birthDate || '',
          occupation: customer.occupation || '',
        });
      } else {
        setFormData({
          firstName: '',
          lastName: '',
          phone: '',
          email: '',
          birthDate: '',
          occupation: '',
        });
      }
      setError(null);
    }
  }, [isOpen, customer]);

  if (!isOpen) return null;

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.firstName.trim()) {
      setError('El nombre es requerido');
      return;
    }

    if (!formData.lastName.trim()) {
      setError('El apellido es requerido');
      return;
    }

    setIsLoading(true);

    try {
      const data = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phone: formData.phone.trim() || undefined,
        email: formData.email.trim() || undefined,
        birthDate: formData.birthDate || undefined,
        occupation: formData.occupation.trim() || undefined,
      };

      if (isEditing) {
        const updated = await window.electronAPI.customers.update(customer.id, data);
        if (updated) onSavedCustomer?.(updated);
      } else {
        const created = await window.electronAPI.customers.create(data);
        if (created) onSavedCustomer?.(created);
      }

      onSaved();
    } catch (err: any) {
      console.error('Error saving customer:', err);
      setError(err.message || 'Error al guardar el cliente');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl shadow-xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-bold text-foreground">
            {isEditing ? 'Editar Cliente' : 'Nuevo Cliente'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-muted-foreground hover:bg-accent rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Nombre y Apellido */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Nombre *
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                className="w-full px-3 py-2 border text-foreground border-input rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-brand-orange"
                placeholder="Juan"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Apellido *
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                className="w-full px-3 py-2 border text-foreground border-input rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-brand-orange"
                placeholder="Pérez"
              />
            </div>
          </div>

          {/* Fecha de nacimiento y Profesión */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Fecha de nacimiento 🎂
              </label>
              <input
                type="date"
                value={formData.birthDate}
                onChange={(e) => handleChange('birthDate', e.target.value)}
                className="w-full px-3 py-2 border text-foreground border-input rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-brand-orange"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Profesión
              </label>
              <input
                type="text"
                value={formData.occupation}
                onChange={(e) => handleChange('occupation', e.target.value)}
                className="w-full px-3 py-2 border text-foreground border-input rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-brand-orange"
                placeholder="Ej: Médico, Abogado, Estudiante..."
              />
            </div>
          </div>

          {/* Teléfono */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Teléfono / WhatsApp
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              className="w-full px-3 py-2 border text-foreground border-input rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-brand-orange"
              placeholder="+54 11 1234-5678"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Incluí el código de país para enviar WhatsApp
            </p>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className="w-full px-3 py-2 border text-foreground border-input rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-brand-orange"
              placeholder="cliente@email.com"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-3 border border-input text-foreground rounded-lg hover:bg-accent disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-brand-orange text-white rounded-lg hover:opacity-90 disabled:opacity-50 font-medium"
            >
              {isLoading ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Crear Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}