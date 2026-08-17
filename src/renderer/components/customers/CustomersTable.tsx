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
    <div className="bg-card rounded-xl shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-secondary border-b border-border">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Cliente
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Profesión
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Cumpleaños
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Contacto
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {customers.map((customer) => {
              const isToday = isBirthdayToday(customer.birthDate);
              const age = calculateAge(customer.birthDate);

              return (
                <tr
                  key={customer.id}
                  className={`hover:bg-accent transition-colors ${isToday ? "bg-brand-yellow/15" : ""}`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {isToday && <span title="¡Cumpleaños hoy!">🎂</span>}
                      <div>
                        <p className="font-medium text-foreground">
                          {customer.fullName}
                        </p>
                        {age !== null && (
                          <p className="text-sm text-muted-foreground">{age} años</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {customer.occupation ? (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Briefcase className="w-4 h-4 text-muted-foreground" />
                        {customer.occupation}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {customer.birthDate ? (
                      <div className="flex items-center gap-2">
                        <Cake
                          className={`w-4 h-4 ${isToday ? "text-brand-orange" : "text-muted-foreground"}`}
                        />
                        <span
                          className={
                            isToday
                              ? "text-brand-orange-ink font-medium"
                              : "text-muted-foreground"
                          }
                        >
                          {formatBirthDate(customer.birthDate)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      {customer.phone && (
                        <p className="text-sm text-muted-foreground">
                          📱 {customer.phone}
                        </p>
                      )}
                      {customer.email && (
                        <p className="text-sm text-muted-foreground truncate max-w-[180px]">
                          ✉️ {customer.email}
                        </p>
                      )}
                      {!customer.phone && !customer.email && (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => onViewDetail(customer)}
                        className="p-2 text-muted-foreground hover:bg-accent rounded-lg transition-colors"
                        title="Ver detalle"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onEdit(customer)}
                        className="p-2 text-brand-orange-ink hover:bg-brand-orange/10 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(customer)}
                        className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
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
