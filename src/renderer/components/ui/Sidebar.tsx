// src/components/layout/Sidebar.tsx
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  Package,
  Users,
  Truck,
  Wallet,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/renderer/lib/utils";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: ShoppingCart, label: "Ventas / POS", path: "/pos" },
  { icon: Receipt, label: "Historial de Ventas", path: "/sales" },
  { icon: Package, label: "Inventario", path: "/inventory" },
  { icon: Users, label: "Clientes", path: "/customers" },
  { icon: Truck, label: "Proveedores", path: "/suppliers" },
  { icon: Wallet, label: "Egresos", path: "/expenses" },
  { icon: BarChart3, label: "Reportes", path: "/reports" },
  { icon: Settings, label: "Configuración", path: "/settings" },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation();
  const [isHovered, setIsHovered] = useState(false);

  // Si está colapsado pero tiene hover, se expande temporalmente
  const isExpanded = !collapsed || isHovered;

  return (
    <aside
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "h-screen bg-brand-dark text-white border-r border-black/20 flex flex-col transition-all duration-300 ease-in-out relative z-20",
        isExpanded ? "w-64" : "w-16"
      )}
    >
      {/* Header */}
      <div className={cn(
        "border-b border-white/10 transition-all duration-300",
        isExpanded ? "p-6" : "p-4"
      )}>
        {isExpanded ? (
          <>
            <h1 className="text-2xl font-bold text-brand-green whitespace-nowrap">Nueva Siembra</h1>
            <p className="text-xs text-white/60 mt-1 whitespace-nowrap">
              Punto de Venta
            </p>
          </>
        ) : (
          <div className="w-8 h-8 rounded-lg bg-brand-green flex items-center justify-center mx-auto">
            <span className="text-sm font-bold text-brand-dark">NS</span>
          </div>
        )}
      </div>

      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className={cn(
          "absolute top-20 -right-3 w-6 h-6 bg-brand-dark border border-white/20 rounded-full flex items-center justify-center",
          "hover:bg-white/10 transition-colors shadow-sm",
          "opacity-0 group-hover:opacity-100",
          isHovered && "opacity-100"
        )}
        title={collapsed ? "Fijar sidebar" : "Colapsar sidebar"}
      >
        {collapsed ? (
          <ChevronRight className="w-3 h-3 text-white/70" />
        ) : (
          <ChevronLeft className="w-3 h-3 text-white/70" />
        )}
      </button>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto overflow-x-hidden">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              title={!isExpanded ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-200",
                isExpanded ? "px-4 py-3" : "px-3 py-3 justify-center",
                isActive
                  ? "bg-brand-green text-brand-dark"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {isExpanded && (
                <span className="whitespace-nowrap overflow-hidden">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className={cn(
        "border-t border-white/10 transition-all duration-300",
        isExpanded ? "p-4" : "p-2"
      )}>
        <div className={cn(
          "flex items-center gap-3 rounded-lg",
          isExpanded ? "px-4 py-2" : "justify-center py-2"
        )}>
          <div className="w-8 h-8 rounded-full bg-brand-green/25 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-semibold text-brand-green">A</span>
          </div>
          {isExpanded && (
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium whitespace-nowrap">Admin</p>
              <p className="text-xs text-white/60 whitespace-nowrap">Administrador</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}