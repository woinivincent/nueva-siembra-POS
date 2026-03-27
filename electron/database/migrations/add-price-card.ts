// electron/database/migrations/add-price-card.ts
import { sqlite } from '../client.js';

export function addPriceCardColumn() {
  try {
    // Verificar si la columna ya existe
    const tableInfo = sqlite.prepare("PRAGMA table_info(products)").all() as any[];
    const hasColumn = tableInfo.some(col => col.name === 'price_card');
    
    if (!hasColumn) {
      console.log('📦 Agregando columna price_card a productos...');
      
      // Agregar columna price_card (precio para tarjeta/transferencia)
      sqlite.exec(`ALTER TABLE products ADD COLUMN price_card REAL`);
      
      // Por defecto, copiar el precio actual como precio de tarjeta (pueden ser iguales inicialmente)
      sqlite.exec(`UPDATE products SET price_card = price WHERE price_card IS NULL`);
      
      console.log('✅ Columna price_card agregada correctamente');
    }
  } catch (error) {
    console.error('Error en migración price_card:', error);
  }
}