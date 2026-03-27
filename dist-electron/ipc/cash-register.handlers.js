"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerCashRegisterHandlers = registerCashRegisterHandlers;
// electron/ipc/cash-register.handlers.ts
const electron_1 = require("electron");
const cash_register_repository_js_1 = require("../repositories/cash-register.repository.js");
function registerCashRegisterHandlers() {
    // Obtener caja abierta
    electron_1.ipcMain.handle('cash:getOpen', () => {
        return cash_register_repository_js_1.cashRegisterRepository.getOpenRegister();
    });
    // Abrir caja
    electron_1.ipcMain.handle('cash:open', (_, openingAmount, userId) => {
        return cash_register_repository_js_1.cashRegisterRepository.openRegister(openingAmount, userId);
    });
    // Cerrar caja
    electron_1.ipcMain.handle('cash:close', (_, id, closingAmount, notes) => {
        return cash_register_repository_js_1.cashRegisterRepository.closeRegister(id, closingAmount, notes);
    });
    // Obtener resumen para cierre
    electron_1.ipcMain.handle('cash:getClosingSummary', (_, registerId) => {
        return cash_register_repository_js_1.cashRegisterRepository.getClosingSummary(registerId);
    });
    // Historial de cajas
    electron_1.ipcMain.handle('cash:getHistory', (_, limit) => {
        return cash_register_repository_js_1.cashRegisterRepository.getHistory(limit);
    });
    // Obtener movimientos de una caja
    electron_1.ipcMain.handle('cash:getMovements', (_, registerId) => {
        return cash_register_repository_js_1.cashRegisterRepository.getMovementsByRegister(registerId);
    });
    // Agregar movimiento
    electron_1.ipcMain.handle('cash:addMovement', (_, data) => {
        return cash_register_repository_js_1.cashRegisterRepository.addMovement(data);
    });
    // Eliminar movimiento
    electron_1.ipcMain.handle('cash:deleteMovement', (_, id) => {
        return cash_register_repository_js_1.cashRegisterRepository.deleteMovement(id);
    });
    // Ventas por método de pago
    electron_1.ipcMain.handle('cash:getSalesByPaymentMethod', (_, registerId) => {
        return cash_register_repository_js_1.cashRegisterRepository.getSalesByPaymentMethod(registerId);
    });
    console.log('✅ Cash register IPC handlers registrados');
}
