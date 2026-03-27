"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addPriceCardColumn = addPriceCardColumn;
// electron/database/migrations/add-price-card.ts
const client_js_1 = require("../client.js");
function addPriceCardColumn() {
    try {
        // Verificar si la columna ya existe
        const tableInfo = client_js_1.sqlite.prepare("PRAGMA table_info(products)").all();
        const hasColumn = tableInfo.some(col => col.name === 'price_card');
        if (!hasColumn) {
            console.log('📦 Agregando columna price_card a productos...');
            // Agregar columna price_card (precio para tarjeta/transferencia)
            client_js_1.sqlite.exec(`ALTER TABLE products ADD COLUMN price_card REAL`);
            // Por defecto, copiar el precio actual como precio de tarjeta (pueden ser iguales inicialmente)
            client_js_1.sqlite.exec(`UPDATE products SET price_card = price WHERE price_card IS NULL`);
            console.log('✅ Columna price_card agregada correctamente');
        }
    }
    catch (error) {
        console.error('Error en migración price_card:', error);
    }
}
