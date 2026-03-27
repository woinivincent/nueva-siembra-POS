// src/renderer/pages/Settings.tsx
import { useEffect, useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Save, 
  Building2, 
  CreditCard, 
  Receipt,
  Palette,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

interface AppSettings {
  businessName: string;
  businessAddress: string;
  businessPhone: string;
  businessCuit: string;
  businessLogo: string | null;
  cardSurcharge: number;
  currency: string;
  currencySymbol: string;
  ticketHeader: string;
  ticketFooter: string;
  theme: 'light' | 'dark';
  lowStockAlert: number;
}

export function Settings() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const data = await window.electronAPI.settings.getAll();
      setSettings(data);
    } catch (error) {
      console.error('Error loading settings:', error);
      setError('Error al cargar la configuración');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSave() {
    if (!settings) return;
    
    setIsSaving(true);
    setError(null);
    setSaved(false);

    try {
      const success = await window.electronAPI.settings.saveAll(settings);
      if (success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        setError('Error al guardar');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setError('Error al guardar la configuración');
    } finally {
      setIsSaving(false);
    }
  }

  function handleChange(field: keyof AppSettings, value: string | number) {
    if (!settings) return;
    setSettings({ ...settings, [field]: value });
  }

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="p-6">
        <p className="text-red-500">Error al cargar la configuración</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <SettingsIcon className="w-7 h-7" />
            Configuración
          </h1>
          <p className="text-gray-500">Ajustes del sistema y del negocio</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
        >
          {isSaving ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            <Save className="w-4 h-4" />
          )}
          Guardar
        </button>
      </div>

      {/* Mensajes */}
      {saved && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          Configuración guardada correctamente
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Datos del Negocio */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-blue-600" />
          Datos del Negocio
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del negocio
            </label>
            <input
              type="text"
              value={settings.businessName}
              onChange={(e) => handleChange('businessName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
              placeholder="Mi Negocio"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              CUIT
            </label>
            <input
              type="text"
              value={settings.businessCuit}
              onChange={(e) => handleChange('businessCuit', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
              placeholder="XX-XXXXXXXX-X"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Teléfono
            </label>
            <input
              type="text"
              value={settings.businessPhone}
              onChange={(e) => handleChange('businessPhone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
              placeholder="+54 11 1234-5678"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dirección
            </label>
            <input
              type="text"
              value={settings.businessAddress}
              onChange={(e) => handleChange('businessAddress', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
              placeholder="Av. Principal 123, Ciudad"
            />
          </div>
        </div>
      </div>

      {/* Precios */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-purple-600" />
          Precios y Moneda
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Recargo Tarjeta (%)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.5"
                min="0"
                max="100"
                value={settings.cardSurcharge}
                onChange={(e) => handleChange('cardSurcharge', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white pr-8"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Se aplica automáticamente al precio tarjeta
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Moneda
            </label>
            <select
              value={settings.currency}
              onChange={(e) => handleChange('currency', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
            >
              <option value="ARS">ARS - Peso Argentino</option>
              <option value="USD">USD - Dólar</option>
              <option value="EUR">EUR - Euro</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Símbolo
            </label>
            <input
              type="text"
              value={settings.currencySymbol}
              onChange={(e) => handleChange('currencySymbol', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
              placeholder="$"
              maxLength={3}
            />
          </div>
        </div>
      </div>

      {/* Ticket */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Receipt className="w-5 h-5 text-orange-600" />
          Ticket de Venta
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Encabezado del ticket
            </label>
            <textarea
              value={settings.ticketHeader}
              onChange={(e) => handleChange('ticketHeader', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white resize-none"
              placeholder="Mensaje de bienvenida..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pie del ticket
            </label>
            <textarea
              value={settings.ticketFooter}
              onChange={(e) => handleChange('ticketFooter', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white resize-none"
              placeholder="Mensaje de despedida..."
            />
          </div>
        </div>
      </div>

      {/* Sistema */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Palette className="w-5 h-5 text-green-600" />
          Sistema
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Alerta de stock bajo
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                value={settings.lowStockAlert}
                onChange={(e) => handleChange('lowStockAlert', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Umbral por defecto para alertas de stock
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tema
            </label>
            <select
              value={settings.theme}
              onChange={(e) => handleChange('theme', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 bg-white"
            >
              <option value="light">☀️ Claro</option>
              <option value="dark">🌙 Oscuro (próximamente)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Preview Ticket */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          👁️ Vista previa del Ticket
        </h2>
        <div className="max-w-xs mx-auto text-black bg-gray-100 p-4 rounded-lg font-mono text-sm">
          <div className="text-center border-b border-dashed border-gray-400 pb-2 mb-2">
            <p className="font-bold">{settings.businessName || 'Mi Negocio'}</p>
            {settings.businessAddress && <p className="text-xs">{settings.businessAddress}</p>}
            {settings.businessPhone && <p className="text-xs">Tel: {settings.businessPhone}</p>}
            {settings.businessCuit && <p className="text-xs">CUIT: {settings.businessCuit}</p>}
          </div>
          <p className="text-center text-xs mb-2">{settings.ticketHeader}</p>
          <div className="border-b border-dashed border-gray-400 pb-2 mb-2">
            <div className="flex justify-between text-xs">
              <span>1x Producto ejemplo</span>
              <span>{settings.currencySymbol}100.00</span>
            </div>
          </div>
          <div className="flex justify-between font-bold">
            <span>TOTAL</span>
            <span>{settings.currencySymbol}100.00</span>
          </div>
          <p className="text-center text-xs mt-2 border-t border-dashed border-gray-400 pt-2">
            {settings.ticketFooter}
          </p>
        </div>
      </div>
    </div>
  );
}