// src/renderer/components/suppliers/SuppliersTable.tsx
import { Pencil, Trash2, Phone, Mail, User } from 'lucide-react';
import type { Supplier } from '@/shared/types/electron';

interface Props {
  suppliers: Supplier[];
  onEdit: (supplier: Supplier) => void;
  onDelete: (supplier: Supplier) => void;
}

export function SuppliersTable({ suppliers, onEdit, onDelete }: Props) {
  return (
    <div className="bg-card rounded-xl shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-secondary border-b border-border">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Empresa
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Contacto
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Categoría
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Teléfono / Email
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {suppliers.map((supplier) => (
              <tr key={supplier.id} className="hover:bg-accent transition-colors">
                <td className="px-4 py-3">
                  <p className="font-medium text-foreground">{supplier.companyName}</p>
                </td>
                <td className="px-4 py-3">
                  {supplier.contactName ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <User className="w-4 h-4 text-muted-foreground" />
                      {supplier.contactName}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {supplier.category ? (
                    <span className="px-2 py-1 bg-brand-yellow/30 text-brand-dark text-sm rounded-full">
                      {supplier.category}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="space-y-1">
                    {supplier.phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="w-3 h-3 text-muted-foreground" />
                        {supplier.phone}
                      </div>
                    )}
                    {supplier.email && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="w-3 h-3 text-muted-foreground" />
                        <span className="truncate max-w-[180px]">{supplier.email}</span>
                      </div>
                    )}
                    {!supplier.phone && !supplier.email && (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => onEdit(supplier)}
                      className="p-2 text-brand-orange-ink hover:bg-brand-orange/10 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(supplier)}
                      className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}