// electron/repositories/products.repository.ts
import { sqlite } from '../database/client.js';

export interface Product {
  id: number;
  name: string;
  description: string | null;
  barcode: string | null;
  category: string;
  price: number;
  price_pack_3: number | null;
  price_pack_4: number | null;
  price_pack_5: number | null;
  price_pack_10: number | null;
  cost: number | null;
  stock: number;
  stock_min: number | null;
  unit: 'ud' | 'kg';
  image: string | null;
  is_active: number;
  created_at: number | null;
  updated_at: number | null;
}

export interface ProductDTO {
  id: number;
  name: string;
  description: string | null;
  barcode: string | null;
  category: string;
  price: number;
  pricePack3: number | null;
  pricePack4: number | null;
  pricePack5: number | null;
  pricePack10: number | null;
  cost: number | null;
  stock: number;
  stockMin: number | null;
  unit: 'ud' | 'kg';
  image: string | null;
  isActive: boolean;
  createdAt: Date | null;
  updatedAt: Date | null;
}

function toDTO(row: Product): ProductDTO {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    barcode: row.barcode,
    category: row.category,
    price: row.price,
    pricePack3: row.price_pack_3,
    pricePack4: row.price_pack_4,
    pricePack5: row.price_pack_5,
    pricePack10: row.price_pack_10,
    cost: row.cost,
    stock: row.stock,
    stockMin: row.stock_min,
    unit: row.unit,
    image: row.image,
    isActive: row.is_active === 1,
    createdAt: row.created_at ? new Date(row.created_at * 1000) : null,
    updatedAt: row.updated_at ? new Date(row.updated_at * 1000) : null,
  };
}

export class ProductsRepository {
  getAll(): ProductDTO[] {
    try {
      const stmt = sqlite.prepare('SELECT * FROM products WHERE is_active = 1 ORDER BY name');
      const results = stmt.all() as Product[];
      return results.map(toDTO);
    } catch (error) {
      console.error('Error in getAll:', error);
      return [];
    }
  }

  search(term: string): ProductDTO[] {
    try {
      const searchTerm = `%${term}%`;
      const stmt = sqlite.prepare(`
        SELECT * FROM products 
        WHERE (name LIKE ? OR category LIKE ? OR barcode LIKE ?)
        AND is_active = 1
      `);
      const results = stmt.all(searchTerm, searchTerm, searchTerm) as Product[];
      return results.map(toDTO);
    } catch (error) {
      console.error('Error in search:', error);
      return [];
    }
  }

  getById(id: number): ProductDTO | null {
    try {
      const stmt = sqlite.prepare('SELECT * FROM products WHERE id = ?');
      const result = stmt.get(id) as Product | undefined;
      return result ? toDTO(result) : null;
    } catch (error) {
      console.error('Error in getById:', error);
      return null;
    }
  }

  getByBarcode(barcode: string): ProductDTO | null {
    try {
      const stmt = sqlite.prepare('SELECT * FROM products WHERE barcode = ?');
      const result = stmt.get(barcode) as Product | undefined;
      return result ? toDTO(result) : null;
    } catch (error) {
      console.error('Error in getByBarcode:', error);
      return null;
    }
  }


  getByCategory(category: string): ProductDTO[] {
    try {
      const stmt = sqlite.prepare('SELECT * FROM products WHERE category = ? AND is_active = 1');
      const results = stmt.all(category) as Product[];
      return results.map(toDTO);
    } catch (error) {
      console.error('Error in getByCategory:', error);
      return [];
    }
  }

  getCategories(): string[] {
    try {
      const stmt = sqlite.prepare('SELECT DISTINCT category FROM products WHERE is_active = 1 ORDER BY category');
      const results = stmt.all() as { category: string }[];
      return results.map(r => r.category);
    } catch (error) {
      console.error('Error in getCategories:', error);
      return [];
    }
  }

  getLowStock(): ProductDTO[] {
    try {
      const stmt = sqlite.prepare('SELECT * FROM products WHERE stock <= stock_min AND is_active = 1');
      const results = stmt.all() as Product[];
      return results.map(toDTO);
    } catch (error) {
      console.error('Error in getLowStock:', error);
      return [];
    }
  }

  create(data: Partial<ProductDTO>): ProductDTO | null {
    try {
      const stmt = sqlite.prepare(`
        INSERT INTO products (name, category, price, price_pack_3, price_pack_4, price_pack_5, price_pack_10, cost, stock, stock_min, unit, barcode, description, image)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const result = stmt.run(
        data.name,
        data.category,
        data.price,
        data.pricePack3 ?? null,
        data.pricePack4 ?? null,
        data.pricePack5 ?? null,
        data.pricePack10 ?? null,
        data.cost || 0,
        data.stock || 0,
        data.stockMin || 0,
        data.unit || 'ud',
        data.barcode || null,
        data.description || null,
        data.image || null,
      );
      
      return this.getById(result.lastInsertRowid as number);
    } catch (error) {
      console.error('Error in create:', error);
      return null;
    }
  }

  update(id: number, data: Partial<ProductDTO>): ProductDTO | null {
    try {
      const fields: string[] = [];
      const values: any[] = [];
      
      if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
      if (data.category !== undefined) { fields.push('category = ?'); values.push(data.category); }
      if (data.price !== undefined) { fields.push('price = ?'); values.push(data.price); }
      if (data.pricePack3 !== undefined) { fields.push('price_pack_3 = ?'); values.push(data.pricePack3); }
      if (data.pricePack4 !== undefined) { fields.push('price_pack_4 = ?'); values.push(data.pricePack4); }
      if (data.pricePack5 !== undefined) { fields.push('price_pack_5 = ?'); values.push(data.pricePack5); }
      if (data.pricePack10 !== undefined) { fields.push('price_pack_10 = ?'); values.push(data.pricePack10); }
      if (data.cost !== undefined) { fields.push('cost = ?'); values.push(data.cost); }
      if (data.stock !== undefined) { fields.push('stock = ?'); values.push(data.stock); }
      if (data.stockMin !== undefined) { fields.push('stock_min = ?'); values.push(data.stockMin); }
      if (data.unit !== undefined) { fields.push('unit = ?'); values.push(data.unit); }
      if (data.barcode !== undefined) { fields.push('barcode = ?'); values.push(data.barcode); }
      if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description); }
      if (data.image !== undefined) { fields.push('image = ?'); values.push(data.image); }
      
      if (fields.length === 0) return this.getById(id);
      
      fields.push('updated_at = ?');
      values.push(Math.floor(Date.now() / 1000));
      values.push(id);
      
      const stmt = sqlite.prepare(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`);
      stmt.run(...values);
      
      return this.getById(id);
    } catch (error) {
      console.error('Error in update:', error);
      return null;
    }
  }

  updateStock(id: number, quantity: number): void {
    try {
      const stmt = sqlite.prepare('UPDATE products SET stock = ?, updated_at = ? WHERE id = ?');
      stmt.run(quantity, Math.floor(Date.now() / 1000), id);
    } catch (error) {
      console.error('Error in updateStock:', error);
    }
  }

  decrementStock(id: number, quantity: number): void {
    try {
      const product = this.getById(id);
      if (product) {
        this.updateStock(id, product.stock - quantity);
      }
    } catch (error) {
      console.error('Error in decrementStock:', error);
    }
  }

  delete(id: number): void {
    try {
      const stmt = sqlite.prepare('UPDATE products SET is_active = 0 WHERE id = ?');
      stmt.run(id);
    } catch (error) {
      console.error('Error in delete:', error);
    }
  }
}

export const productsRepository = new ProductsRepository();