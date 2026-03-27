// electron/repositories/suppliers.repository.ts
import { sqlite } from '../database/client.js';

export interface Supplier {
  id: number;
  company_name: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  category: string | null;
  is_active: number;
  created_at: number;
  updated_at: number;
}

export interface SupplierDTO {
  id: number;
  companyName: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  category: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

function toDTO(row: Supplier): SupplierDTO {
  return {
    id: row.id,
    companyName: row.company_name,
    contactName: row.contact_name,
    phone: row.phone,
    email: row.email,
    category: row.category,
    isActive: row.is_active === 1,
    createdAt: new Date(row.created_at * 1000),
    updatedAt: new Date(row.updated_at * 1000),
  };
}

export class SuppliersRepository {
  getAll(): SupplierDTO[] {
    try {
      const stmt = sqlite.prepare('SELECT * FROM suppliers WHERE is_active = 1 ORDER BY company_name');
      const results = stmt.all() as Supplier[];
      return results.map(toDTO);
    } catch (error) {
      console.error('Error in getAll:', error);
      return [];
    }
  }

  search(term: string): SupplierDTO[] {
    try {
      const searchTerm = `%${term}%`;
      const stmt = sqlite.prepare(`
        SELECT * FROM suppliers 
        WHERE (company_name LIKE ? OR contact_name LIKE ? OR phone LIKE ? OR category LIKE ?)
        AND is_active = 1
        ORDER BY company_name
      `);
      const results = stmt.all(searchTerm, searchTerm, searchTerm, searchTerm) as Supplier[];
      return results.map(toDTO);
    } catch (error) {
      console.error('Error in search:', error);
      return [];
    }
  }

  getById(id: number): SupplierDTO | null {
    try {
      const stmt = sqlite.prepare('SELECT * FROM suppliers WHERE id = ?');
      const result = stmt.get(id) as Supplier | undefined;
      return result ? toDTO(result) : null;
    } catch (error) {
      console.error('Error in getById:', error);
      return null;
    }
  }

  getCategories(): string[] {
    try {
      const stmt = sqlite.prepare(`
        SELECT DISTINCT category FROM suppliers 
        WHERE category IS NOT NULL AND category != '' AND is_active = 1 
        ORDER BY category
      `);
      const results = stmt.all() as { category: string }[];
      return results.map(r => r.category);
    } catch (error) {
      console.error('Error in getCategories:', error);
      return [];
    }
  }

  create(data: {
    companyName: string;
    contactName?: string;
    phone?: string;
    email?: string;
    category?: string;
  }): SupplierDTO | null {
    try {
      const now = Math.floor(Date.now() / 1000);
      const stmt = sqlite.prepare(`
        INSERT INTO suppliers (company_name, contact_name, phone, email, category, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 1, ?, ?)
      `);

      const result = stmt.run(
        data.companyName,
        data.contactName || null,
        data.phone || null,
        data.email || null,
        data.category || null,
        now,
        now
      );

      return this.getById(result.lastInsertRowid as number);
    } catch (error) {
      console.error('Error in create:', error);
      return null;
    }
  }

  update(id: number, data: Partial<{
    companyName: string;
    contactName: string;
    phone: string;
    email: string;
    category: string;
  }>): SupplierDTO | null {
    try {
      const fields: string[] = [];
      const values: any[] = [];

      if (data.companyName !== undefined) { fields.push('company_name = ?'); values.push(data.companyName); }
      if (data.contactName !== undefined) { fields.push('contact_name = ?'); values.push(data.contactName || null); }
      if (data.phone !== undefined) { fields.push('phone = ?'); values.push(data.phone || null); }
      if (data.email !== undefined) { fields.push('email = ?'); values.push(data.email || null); }
      if (data.category !== undefined) { fields.push('category = ?'); values.push(data.category || null); }

      if (fields.length === 0) return this.getById(id);

      fields.push('updated_at = ?');
      values.push(Math.floor(Date.now() / 1000));
      values.push(id);

      const stmt = sqlite.prepare(`UPDATE suppliers SET ${fields.join(', ')} WHERE id = ?`);
      stmt.run(...values);

      return this.getById(id);
    } catch (error) {
      console.error('Error in update:', error);
      return null;
    }
  }

  delete(id: number): boolean {
    try {
      const stmt = sqlite.prepare('UPDATE suppliers SET is_active = 0, updated_at = ? WHERE id = ?');
      stmt.run(Math.floor(Date.now() / 1000), id);
      return true;
    } catch (error) {
      console.error('Error in delete:', error);
      return false;
    }
  }
}

export const suppliersRepository = new SuppliersRepository();