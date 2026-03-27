// src/components/layout/Layout.tsx
import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '../ui/Sidebar';

export function Layout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved === 'true';
  });

  const location = useLocation();

  useEffect(() => {
    if (location.pathname === '/pos') {
      setSidebarCollapsed(true);
    }
  }, [location.pathname]);

  const handleToggleSidebar = () => {
    const newValue = !sidebarCollapsed;
    setSidebarCollapsed(newValue);
    localStorage.setItem('sidebarCollapsed', String(newValue));
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar collapsed={sidebarCollapsed} onToggle={handleToggleSidebar} />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}