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
    <div className="bg-white rounded-xl shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Empresa
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Contacto
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Categoría
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Teléfono / Email
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {suppliers.map((supplier) => (
              <tr key={supplier.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{supplier.companyName}</p>
                </td>
                <td className="px-4 py-3">
                  {supplier.contactName ? (
                    <div className="flex items-center gap-2 text-gray-600">
                      <User className="w-4 h-4 text-gray-400" />
                      {supplier.contactName}
                    </div>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {supplier.category ? (
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 text-sm rounded-full">
                      {supplier.category}
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="space-y-1">
                    {supplier.phone && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="w-3 h-3 text-gray-400" />
                        {supplier.phone}
                      </div>
                    )}
                    {supplier.email && (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Mail className="w-3 h-3 text-gray-400" />
                        <span className="truncate max-w-[180px]">{supplier.email}</span>
                      </div>
                    )}
                    {!supplier.phone && !supplier.email && (
                      <span className="text-gray-400">-</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => onEdit(supplier)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(supplier)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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