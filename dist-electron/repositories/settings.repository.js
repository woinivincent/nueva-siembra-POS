"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.settingsRepository = exports.SettingsRepository = void 0;
// electron/repositories/settings.repository.ts
const client_js_1 = require("../database/client.js");
const DEFAULT_SETTINGS = {
    businessName: 'Mi Negocio',
    businessAddress: '',
    businessPhone: '',
    businessCuit: '',
    businessLogo: null,
    cardSurcharge: 10,
    currency: 'ARS',
    currencySymbol: '$',
    ticketHeader: '¡Gracias por su compra!',
    ticketFooter: 'Vuelva pronto',
    theme: 'light',
    lowStockAlert: 5,
};
class SettingsRepository {
    get(key) {
        try {
            const stmt = client_js_1.sqlite.prepare('SELECT value FROM settings WHERE key = ?');
            const result = stmt.get(key);
            return result?.value ?? null;
        }
        catch (error) {
            console.error('Error getting setting:', error);
            return null;
        }
    }
    set(key, value) {
        try {
            const stmt = client_js_1.sqlite.prepare(`
        INSERT INTO settings (key, value, updated_at) 
        VALUES (?, ?, strftime('%s', 'now'))
        ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = strftime('%s', 'now')
      `);
            stmt.run(key, value, value);
            return true;
        }
        catch (error) {
            console.error('Error setting value:', error);
            return false;
        }
    }
    getAll() {
        try {
            const settings = { ...DEFAULT_SETTINGS };
            const stmt = client_js_1.sqlite.prepare('SELECT key, value FROM settings');
            const rows = stmt.all();
            for (const row of rows) {
                switch (row.key) {
                    case 'business_name':
                        settings.businessName = row.value;
                        break;
                    case 'business_address':
                        settings.businessAddress = row.value;
                        break;
                    case 'business_phone':
                        settings.businessPhone = row.value;
                        break;
                    case 'business_cuit':
                        settings.businessCuit = row.value;
                        break;
                    case 'business_logo':
                        settings.businessLogo = row.value;
                        break;
                    case 'card_surcharge':
                        settings.cardSurcharge = parseFloat(row.value) || 10;
                        break;
                    case 'currency':
                        settings.currency = row.value;
                        break;
                    case 'currency_symbol':
                        settings.currencySymbol = row.value;
                        break;
                    case 'ticket_header':
                        settings.ticketHeader = row.value;
                        break;
                    case 'ticket_footer':
                        settings.ticketFooter = row.value;
                        break;
                    case 'theme':
                        settings.theme = row.value;
                        break;
                    case 'low_stock_alert':
                        settings.lowStockAlert = parseInt(row.value) || 5;
                        break;
                }
            }
            return settings;
        }
        catch (error) {
            console.error('Error getting all settings:', error);
            return DEFAULT_SETTINGS;
        }
    }
    saveAll(settings) {
        try {
            const transaction = client_js_1.sqlite.transaction(() => {
                if (settings.businessName !== undefined) {
                    this.set('business_name', settings.businessName);
                }
                if (settings.businessAddress !== undefined) {
                    this.set('business_address', settings.businessAddress);
                }
                if (settings.businessPhone !== undefined) {
                    this.set('business_phone', settings.businessPhone);
                }
                if (settings.businessCuit !== undefined) {
                    this.set('business_cuit', settings.businessCuit);
                }
                if (settings.businessLogo !== undefined) {
                    this.set('business_logo', settings.businessLogo || '');
                }
                if (settings.cardSurcharge !== undefined) {
                    this.set('card_surcharge', settings.cardSurcharge.toString());
                }
                if (settings.currency !== undefined) {
                    this.set('currency', settings.currency);
                }
                if (settings.currencySymbol !== undefined) {
                    this.set('currency_symbol', settings.currencySymbol);
                }
                if (settings.ticketHeader !== undefined) {
                    this.set('ticket_header', settings.ticketHeader);
                }
                if (settings.ticketFooter !== undefined) {
                    this.set('ticket_footer', settings.ticketFooter);
                }
                if (settings.theme !== undefined) {
                    this.set('theme', settings.theme);
                }
                if (settings.lowStockAlert !== undefined) {
                    this.set('low_stock_alert', settings.lowStockAlert.toString());
                }
            });
            transaction();
            return true;
        }
        catch (error) {
            console.error('Error saving settings:', error);
            return false;
        }
    }
    getCardSurcharge() {
        const value = this.get('card_surcharge');
        return value ? parseFloat(value) : 10;
    }
}
exports.SettingsRepository = SettingsRepository;
exports.settingsRepository = new SettingsRepository();
