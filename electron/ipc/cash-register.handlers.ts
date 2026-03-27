// electron/ipc/cash-register.handlers.ts
import { ipcMain } from 'electron';
import { cashRegisterRepository } from '../repositories/cash-register.repository.js';

export function registerCashRegisterHandlers() {
  // Obtener caja abierta
  ipcMain.handle('cash:getOpen', () => {
    return cashRegisterRepository.getOpenRegister();
  });

  // Abrir caja
  ipcMain.handle('cash:open', (_, openingAmount: number, userId?: number) => {
    return cashRegisterRepository.openRegister(openingAmount, userId);
  });

  // Cerrar caja
  ipcMain.handle('cash:close', (_, id: number, closingAmount: number, notes?: string) => {
    return cashRegisterRepository.closeRegister(id, closingAmount, notes);
  });

  // Obtener resumen para cierre
  ipcMain.handle('cash:getClosingSummary', (_, registerId: number) => {
    return cashRegisterRepository.getClosingSummary(registerId);
  });

  // Historial de cajas
  ipcMain.handle('cash:getHistory', (_, limit?: number) => {
    return cashRegisterRepository.getHistory(limit);
  });

  // Obtener movimientos de una caja
  ipcMain.handle('cash:getMovements', (_, registerId: number) => {
    return cashRegisterRepository.getMovementsByRegister(registerId);
  });

  // Agregar movimiento
  ipcMain.handle('cash:addMovement', (_, data: {
    cashRegisterId: number;
    type: 'income' | 'expense';
    amount: number;
    concept: string;
    description?: string;
  }) => {
    return cashRegisterRepository.addMovement(data);
  });

  // Eliminar movimiento
  ipcMain.handle('cash:deleteMovement', (_, id: number) => {
    return cashRegisterRepository.deleteMovement(id);
  });

  // Ventas por método de pago
  ipcMain.handle('cash:getSalesByPaymentMethod', (_, registerId: number) => {
    return cashRegisterRepository.getSalesByPaymentMethod(registerId);
  });

  console.log('✅ Cash register IPC handlers registrados');
}