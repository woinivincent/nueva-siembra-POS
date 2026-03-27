"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.customersRepository = exports.CustomersRepository = void 0;
// electron/repositories/customers.repository.ts
const client_js_1 = require("../database/client.js");
function toDTO(row) {
    return {
        id: row.id,
        firstName: row.first_name,
        lastName: row.last_name,
        fullName: `${row.first_name} ${row.last_name}`,
        phone: row.phone,
        email: row.email,
        birthDate: row.birth_date,
        occupation: row.occupation,
        isActive: row.is_active === 1,
        createdAt: new Date(row.created_at * 1000),
        updatedAt: new Date(row.updated_at * 1000),
    };
}
class CustomersRepository {
    getAll() {
        try {
            const stmt = client_js_1.sqlite.prepare('SELECT * FROM customers WHERE is_active = 1 ORDER BY first_name, last_name');
            const results = stmt.all();
            return results.map(toDTO);
        }
        catch (error) {
            console.error('Error in getAll:', error);
            return [];
        }
    }
    search(term) {
        try {
            const searchTerm = `%${term}%`;
            const stmt = client_js_1.sqlite.prepare(`
        SELECT * FROM customers 
        WHERE (first_name LIKE ? OR last_name LIKE ? OR phone LIKE ? OR occupation LIKE ?)
        AND is_active = 1
        ORDER BY first_name, last_name
      `);
            const results = stmt.all(searchTerm, searchTerm, searchTerm, searchTerm);
            return results.map(toDTO);
        }
        catch (error) {
            console.error('Error in search:', error);
            return [];
        }
    }
    getById(id) {
        try {
            const stmt = client_js_1.sqlite.prepare('SELECT * FROM customers WHERE id = ?');
            const result = stmt.get(id);
            return result ? toDTO(result) : null;
        }
        catch (error) {
            console.error('Error in getById:', error);
            return null;
        }
    }
    // Obtener cumpleañeros del día
    getTodayBirthdays() {
        try {
            // Obtener día y mes actual
            const today = new Date();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            const pattern = `%-${month}-${day}`; // Formato: YYYY-MM-DD
            const stmt = client_js_1.sqlite.prepare(`
        SELECT * FROM customers 
        WHERE birth_date LIKE ? AND is_active = 1
        ORDER BY first_name, last_name
      `);
            const results = stmt.all(pattern);
            return results.map(toDTO);
        }
        catch (error) {
            console.error('Error in getTodayBirthdays:', error);
            return [];
        }
    }
    // Obtener próximos cumpleaños (próximos 7 días)
    getUpcomingBirthdays(days = 7) {
        try {
            const today = new Date();
            const birthdays = [];
            // Obtener todos los clientes activos con fecha de nacimiento
            const stmt = client_js_1.sqlite.prepare(`
        SELECT * FROM customers 
        WHERE birth_date IS NOT NULL AND birth_date != '' AND is_active = 1
      `);
            const results = stmt.all();
            for (const customer of results) {
                if (!customer.birth_date)
                    continue;
                const [, month, day] = customer.birth_date.split('-').map(Number);
                // Crear fecha de cumpleaños este año
                const birthdayThisYear = new Date(today.getFullYear(), month - 1, day);
                // Si ya pasó, usar el del próximo año
                if (birthdayThisYear < today) {
                    birthdayThisYear.setFullYear(today.getFullYear() + 1);
                }
                // Calcular diferencia en días
                const diffTime = birthdayThisYear.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays >= 0 && diffDays <= days) {
                    birthdays.push(toDTO(customer));
                }
            }
            return birthdays;
        }
        catch (error) {
            console.error('Error in getUpcomingBirthdays:', error);
            return [];
        }
    }
    create(data) {
        try {
            const now = Math.floor(Date.now() / 1000);
            const stmt = client_js_1.sqlite.prepare(`
        INSERT INTO customers (first_name, last_name, phone, email, birth_date, occupation, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
      `);
            const result = stmt.run(data.firstName, data.lastName, data.phone || null, data.email || null, data.birthDate || null, data.occupation || null, now, now);
            return this.getById(result.lastInsertRowid);
        }
        catch (error) {
            console.error('Error in create:', error);
            return null;
        }
    }
    update(id, data) {
        try {
            const fields = [];
            const values = [];
            if (data.firstName !== undefined) {
                fields.push('first_name = ?');
                values.push(data.firstName);
            }
            if (data.lastName !== undefined) {
                fields.push('last_name = ?');
                values.push(data.lastName);
            }
            if (data.phone !== undefined) {
                fields.push('phone = ?');
                values.push(data.phone || null);
            }
            if (data.email !== undefined) {
                fields.push('email = ?');
                values.push(data.email || null);
            }
            if (data.birthDate !== undefined) {
                fields.push('birth_date = ?');
                values.push(data.birthDate || null);
            }
            if (data.occupation !== undefined) {
                fields.push('occupation = ?');
                values.push(data.occupation || null);
            }
            if (fields.length === 0)
                return this.getById(id);
            fields.push('updated_at = ?');
            values.push(Math.floor(Date.now() / 1000));
            values.push(id);
            const stmt = client_js_1.sqlite.prepare(`UPDATE customers SET ${fields.join(', ')} WHERE id = ?`);
            stmt.run(...values);
            return this.getById(id);
        }
        catch (error) {
            console.error('Error in update:', error);
            return null;
        }
    }
    delete(id) {
        try {
            const stmt = client_js_1.sqlite.prepare('UPDATE customers SET is_active = 0, updated_at = ? WHERE id = ?');
            stmt.run(Math.floor(Date.now() / 1000), id);
            return true;
        }
        catch (error) {
            console.error('Error in delete:', error);
            return false;
        }
    }
    // Historial de compras del cliente
    getPurchaseHistory(customerId) {
        try {
            const stmt = client_js_1.sqlite.prepare(`
        SELECT s.*, 
          (SELECT COUNT(*) FROM sale_items WHERE sale_id = s.id) as items_count
        FROM sales s
        WHERE s.customer_id = ? AND s.status = 'completed'
        ORDER BY s.created_at DESC
        LIMIT 50
      `);
            const results = stmt.all(customerId);
            return results.map(row => ({
                id: row.id,
                total: row.total,
                paymentMethod: row.payment_method,
                itemsCount: row.items_count,
                createdAt: new Date(row.created_at * 1000),
            }));
        }
        catch (error) {
            console.error('Error in getPurchaseHistory:', error);
            return [];
        }
    }
    // Estadísticas del cliente
    getCustomerStats(customerId) {
        try {
            const stmt = client_js_1.sqlite.prepare(`
        SELECT 
          COUNT(*) as total_purchases,
          COALESCE(SUM(total), 0) as total_spent,
          MAX(created_at) as last_purchase
        FROM sales
        WHERE customer_id = ? AND status = 'completed'
      `);
            const result = stmt.get(customerId);
            return {
                totalPurchases: result.total_purchases,
                totalSpent: result.total_spent,
                lastPurchase: result.last_purchase ? new Date(result.last_purchase * 1000) : null,
            };
        }
        catch (error) {
            console.error('Error in getCustomerStats:', error);
            return { totalPurchases: 0, totalSpent: 0, lastPurchase: null };
        }
    }
}
exports.CustomersRepository = CustomersRepository;
exports.customersRepository = new CustomersRepository();
