// src/renderer/components/customers/CustomersTable.tsx
import { Pencil, Trash2, Eye, Cake, Briefcase } from "lucide-react";
import type { Customer } from "@/shared/types/electron";

interface Props {
  customers: Customer[];
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
  onViewDetail: (customer: Customer) => void;
}

export function CustomersTable({
  customers,
  onEdit,
  onDelete,
  onViewDetail,
}: Props) {
  function isBirthdayToday(birthDate: string | null): boolean {
    if (!birthDate) return false;
    const today = new Date();
    const [, month, day] = birthDate.split("-").map(Number);
    return today.getMonth() + 1 === month && today.getDate() === day;
  }

  function formatBirthDate(birthDate: string | null): string {
    if (!birthDate) return "-";
    const [year, month, day] = birthDate.split("-");
    return `${day}/${month}/${year}`;
  }

  function calculateAge(birthDate: string | null): number | null {
    if (!birthDate) return null;
    const [year, month, day] = birthDate.split("-").map(Number);
    const today = new Date();
    const birth = new Date(year, month - 1, day);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }
    return age;
  }

  return (
    <div className="bg-white rounded-xl shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Cliente
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Profesión
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Cumpleaños
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Contacto
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {customers.map((customer) => {
              const isToday = isBirthdayToday(customer.birthDate);
              const age = calculateAge(customer.birthDate);

              return (
                <tr
                  key={customer.id}
                  className={`hover:bg-gray-50 transition-colors ${isToday ? "bg-pink-50" : ""}`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {isToday && <span title="¡Cumpleaños hoy!">🎂</span>}
                      <div>
                        <p className="font-medium text-gray-900">
                          {customer.fullName}
                        </p>
                        {age !== null && (
                          <p className="text-sm text-gray-500">{age} años</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {customer.occupation ? (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Briefcase className="w-4 h-4 text-gray-400" />
                        {customer.occupation}
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {customer.birthDate ? (
                      <div className="flex items-center gap-2">
                        <Cake
                          className={`w-4 h-4 ${isToday ? "text-pink-500" : "text-gray-400"}`}
                        />
                        <span
                          className={
                            isToday
                              ? "text-pink-600 font-medium"
                              : "text-gray-600"
                          }
                        >
                          {formatBirthDate(customer.birthDate)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      {customer.phone && (
                        <p className="text-sm text-gray-600">
                          📱 {customer.phone}
                        </p>
                      )}
                      {customer.email && (
                        <p className="text-sm text-gray-500 truncate max-w-[180px]">
                          ✉️ {customer.email}
                        </p>
                      )}
                      {!customer.phone && !customer.email && (
                        <span className="text-gray-400">-</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => onViewDetail(customer)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Ver detalle"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onEdit(customer)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(customer)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
