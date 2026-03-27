"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productsRepository = exports.ProductsRepository = void 0;
// electron/repositories/products.repository.ts
const client_js_1 = require("../database/client.js");
function toDTO(row) {
    return {
        id: row.id,
        name: row.name,
        description: row.description,
        barcode: row.barcode,
        category: row.category,
        price: row.price,
        priceCard: row.price_card ?? row.price, // Si no tiene precio tarjeta, usa el precio normal
        cost: row.cost,
        stock: row.stock,
        stockMin: row.stock_min,
        unit: row.unit,
        image: row.image,
        isActive: row.is_active === 1,
        isFavorite: row.is_favorite === 1,
        favoriteKey: row.favorite_key,
        createdAt: row.created_at ? new Date(row.created_at * 1000) : null,
        updatedAt: row.updated_at ? new Date(row.updated_at * 1000) : null,
    };
}
class ProductsRepository {
    getAll() {
        try {
            const stmt = client_js_1.sqlite.prepare('SELECT * FROM products WHERE is_active = 1 ORDER BY name');
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
        SELECT * FROM products 
        WHERE (name LIKE ? OR category LIKE ? OR barcode LIKE ?)
        AND is_active = 1
      `);
            const results = stmt.all(searchTerm, searchTerm, searchTerm);
            return results.map(toDTO);
        }
        catch (error) {
            console.error('Error in search:', error);
            return [];
        }
    }
    getById(id) {
        try {
            const stmt = client_js_1.sqlite.prepare('SELECT * FROM products WHERE id = ?');
            const result = stmt.get(id);
            return result ? toDTO(result) : null;
        }
        catch (error) {
            console.error('Error in getById:', error);
            return null;
        }
    }
    getByBarcode(barcode) {
        try {
            const stmt = client_js_1.sqlite.prepare('SELECT * FROM products WHERE barcode = ?');
            const result = stmt.get(barcode);
            return result ? toDTO(result) : null;
        }
        catch (error) {
            console.error('Error in getByBarcode:', error);
            return null;
        }
    }
    getFavorites() {
        try {
            const stmt = client_js_1.sqlite.prepare('SELECT * FROM products WHERE is_favorite = 1 AND is_active = 1 ORDER BY favorite_key');
            const results = stmt.all();
            return results.map(toDTO);
        }
        catch (error) {
            console.error('Error in getFavorites:', error);
            return [];
        }
    }
    getByCategory(category) {
        try {
            const stmt = client_js_1.sqlite.prepare('SELECT * FROM products WHERE category = ? AND is_active = 1');
            const results = stmt.all(category);
            return results.map(toDTO);
        }
        catch (error) {
            console.error('Error in getByCategory:', error);
            return [];
        }
    }
    getCategories() {
        try {
            const stmt = client_js_1.sqlite.prepare('SELECT DISTINCT category FROM products WHERE is_active = 1 ORDER BY category');
            const results = stmt.all();
            return results.map(r => r.category);
        }
        catch (error) {
            console.error('Error in getCategories:', error);
            return [];
        }
    }
    getLowStock() {
        try {
            const stmt = client_js_1.sqlite.prepare('SELECT * FROM products WHERE stock <= stock_min AND is_active = 1');
            const results = stmt.all();
            return results.map(toDTO);
        }
        catch (error) {
            console.error('Error in getLowStock:', error);
            return [];
        }
    }
    create(data) {
        try {
            const stmt = client_js_1.sqlite.prepare(`
        INSERT INTO products (name, category, price, price_card, cost, stock, stock_min, unit, barcode, description, image, is_favorite, favorite_key)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
            const result = stmt.run(data.name, data.category, data.price, data.priceCard ?? data.price, // Si no especifica precio tarjeta, usa el precio normal
            data.cost || 0, data.stock || 0, data.stockMin || 0, data.unit || 'ud', data.barcode || null, data.description || null, data.image || null, data.isFavorite ? 1 : 0, data.favoriteKey || null);
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
            if (data.name !== undefined) {
                fields.push('name = ?');
                values.push(data.name);
            }
            if (data.category !== undefined) {
                fields.push('category = ?');
                values.push(data.category);
            }
            if (data.price !== undefined) {
                fields.push('price = ?');
                values.push(data.price);
            }
            if (data.priceCard !== undefined) {
                fields.push('price_card = ?');
                values.push(data.priceCard);
            }
            if (data.cost !== undefined) {
                fields.push('cost = ?');
                values.push(data.cost);
            }
            if (data.stock !== undefined) {
                fields.push('stock = ?');
                values.push(data.stock);
            }
            if (data.stockMin !== undefined) {
                fields.push('stock_min = ?');
                values.push(data.stockMin);
            }
            if (data.unit !== undefined) {
                fields.push('unit = ?');
                values.push(data.unit);
            }
            if (data.barcode !== undefined) {
                fields.push('barcode = ?');
                values.push(data.barcode);
            }
            if (data.description !== undefined) {
                fields.push('description = ?');
                values.push(data.description);
            }
            if (data.image !== undefined) {
                fields.push('image = ?');
                values.push(data.image);
            }
            if (data.isFavorite !== undefined) {
                fields.push('is_favorite = ?');
                values.push(data.isFavorite ? 1 : 0);
            }
            if (data.favoriteKey !== undefined) {
                fields.push('favorite_key = ?');
                values.push(data.favoriteKey);
            }
            if (fields.length === 0)
                return this.getById(id);
            fields.push('updated_at = ?');
            values.push(Math.floor(Date.now() / 1000));
            values.push(id);
            const stmt = client_js_1.sqlite.prepare(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`);
            stmt.run(...values);
            return this.getById(id);
        }
        catch (error) {
            console.error('Error in update:', error);
            return null;
        }
    }
    updateStock(id, quantity) {
        try {
            const stmt = client_js_1.sqlite.prepare('UPDATE products SET stock = ?, updated_at = ? WHERE id = ?');
            stmt.run(quantity, Math.floor(Date.now() / 1000), id);
        }
        catch (error) {
            console.error('Error in updateStock:', error);
        }
    }
    decrementStock(id, quantity) {
        try {
            const product = this.getById(id);
            if (product) {
                this.updateStock(id, product.stock - quantity);
            }
        }
        catch (error) {
            console.error('Error in decrementStock:', error);
        }
    }
    delete(id) {
        try {
            const stmt = client_js_1.sqlite.prepare('UPDATE products SET is_active = 0 WHERE id = ?');
            stmt.run(id);
        }
        catch (error) {
            console.error('Error in delete:', error);
        }
    }
}
exports.ProductsRepository = ProductsRepository;
exports.productsRepository = new ProductsRepository();
