"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerIpcHandlers = registerIpcHandlers;
// electron/ipc/handlers.ts
const electron_1 = require("electron");
const products_repository_js_1 = require("../repositories/products.repository.js");
const cash_register_repository_js_1 = require("../repositories/cash-register.repository.js");
const sales_repository_js_1 = require("../repositories/sales.repository.js");
const customers_repository_js_1 = require("../repositories/customers.repository.js");
const suppliers_repository_js_1 = require("../repositories/suppliers.repository.js");
const reports_repository_js_1 = require("../repositories/reports.repository.js");
const reserve_fund_repository_js_1 = require("../repositories/reserve-fund.repository.js");
const dashboard_repository_js_1 = require("../repositories/dashboard.repository.js");
const settings_repository_js_1 = require("../repositories/settings.repository.js");
const excel_service_1 = require("../services/excel.service");
const image_service_js_1 = require("../services/image.service.js");
function registerIpcHandlers() {
    // ==================== PRODUCTS ====================
    electron_1.ipcMain.handle("products:getAll", () => {
        try {
            return products_repository_js_1.productsRepository.getAll();
        }
        catch (error) {
            console.error("Error getting products:", error);
            throw error;
        }
    });
    electron_1.ipcMain.handle("products:search", (_event, term) => {
        try {
            return products_repository_js_1.productsRepository.search(term);
        }
        catch (error) {
            console.error("Error searching products:", error);
            throw error;
        }
    });
    electron_1.ipcMain.handle("products:getById", (_event, id) => {
        try {
            return products_repository_js_1.productsRepository.getById(id);
        }
        catch (error) {
            console.error("Error getting product by id:", error);
            throw error;
        }
    });
    electron_1.ipcMain.handle("products:getByBarcode", (_event, barcode) => {
        try {
            return products_repository_js_1.productsRepository.getByBarcode(barcode);
        }
        catch (error) {
            console.error("Error getting product by barcode:", error);
            throw error;
        }
    });
    electron_1.ipcMain.handle("products:getFavorites", () => {
        try {
            return products_repository_js_1.productsRepository.getFavorites();
        }
        catch (error) {
            console.error("Error getting favorites:", error);
            throw error;
        }
    });
    electron_1.ipcMain.handle("products:getByCategory", (_event, category) => {
        try {
            return products_repository_js_1.productsRepository.getByCategory(category);
        }
        catch (error) {
            console.error("Error getting products by category:", error);
            throw error;
        }
    });
    electron_1.ipcMain.handle("products:getCategories", () => {
        try {
            return products_repository_js_1.productsRepository.getCategories();
        }
        catch (error) {
            console.error("Error getting categories:", error);
            throw error;
        }
    });
    electron_1.ipcMain.handle("products:getLowStock", () => {
        try {
            return products_repository_js_1.productsRepository.getLowStock();
        }
        catch (error) {
            console.error("Error getting low stock products:", error);
            throw error;
        }
    });
    electron_1.ipcMain.handle("products:create", (_event, data) => {
        try {
            return products_repository_js_1.productsRepository.create(data);
        }
        catch (error) {
            console.error("Error creating product:", error);
            throw error;
        }
    });
    electron_1.ipcMain.handle("products:update", (_event, { id, data }) => {
        try {
            return products_repository_js_1.productsRepository.update(id, data);
        }
        catch (error) {
            console.error("Error updating product:", error);
            throw error;
        }
    });
    electron_1.ipcMain.handle("products:delete", (_event, id) => {
        try {
            products_repository_js_1.productsRepository.delete(id);
            return { success: true };
        }
        catch (error) {
            console.error("Error deleting product:", error);
            throw error;
        }
    });
    // ==================== CASH REGISTER ====================
    electron_1.ipcMain.handle("cash:getOpen", () => {
        try {
            return cash_register_repository_js_1.cashRegisterRepository.getOpenRegister();
        }
        catch (error) {
            console.error("Error getting open register:", error);
            throw error;
        }
    });
    electron_1.ipcMain.handle("cash:open", (_event, openingAmount, userId) => {
        try {
            return cash_register_repository_js_1.cashRegisterRepository.openRegister(openingAmount, userId);
        }
        catch (error) {
            console.error("Error opening register:", error);
            throw error;
        }
    });
    electron_1.ipcMain.handle("cash:close", (_event, id, closingAmount, notes) => {
        try {
            return cash_register_repository_js_1.cashRegisterRepository.closeRegister(id, closingAmount, notes);
        }
        catch (error) {
            console.error("Error closing register:", error);
            throw error;
        }
    });
    electron_1.ipcMain.handle("cash:getClosingSummary", (_event, registerId) => {
        try {
            return cash_register_repository_js_1.cashRegisterRepository.getClosingSummary(registerId);
        }
        catch (error) {
            console.error("Error getting closing summary:", error);
            throw error;
        }
    });
    electron_1.ipcMain.handle("cash:getHistory", (_event, limit) => {
        try {
            return cash_register_repository_js_1.cashRegisterRepository.getHistory(limit);
        }
        catch (error) {
            console.error("Error getting history:", error);
            throw error;
        }
    });
    electron_1.ipcMain.handle("cash:getMovements", (_event, registerId) => {
        try {
            return cash_register_repository_js_1.cashRegisterRepository.getMovementsByRegister(registerId);
        }
        catch (error) {
            console.error("Error getting movements:", error);
            throw error;
        }
    });
    electron_1.ipcMain.handle("cash:addMovement", (_event, data) => {
        try {
            return cash_register_repository_js_1.cashRegisterRepository.addMovement(data);
        }
        catch (error) {
            console.error("Error adding movement:", error);
            throw error;
        }
    });
    electron_1.ipcMain.handle("cash:deleteMovement", (_event, id) => {
        try {
            return cash_register_repository_js_1.cashRegisterRepository.deleteMovement(id);
        }
        catch (error) {
            console.error("Error deleting movement:", error);
            throw error;
        }
    });
    electron_1.ipcMain.handle("cash:getSalesByPaymentMethod", (_event, registerId) => {
        try {
            return cash_register_repository_js_1.cashRegisterRepository.getSalesByPaymentMethod(registerId);
        }
        catch (error) {
            console.error("Error getting sales by payment method:", error);
            throw error;
        }
    });
    // ==================== SALES ====================
    electron_1.ipcMain.handle("sales:create", (_event, data) => {
        try {
            return sales_repository_js_1.salesRepository.create(data);
        }
        catch (error) {
            console.error("Error creating sale:", error);
            throw error;
        }
    });
    electron_1.ipcMain.handle("sales:getById", (_event, id) => {
        try {
            return sales_repository_js_1.salesRepository.getById(id);
        }
        catch (error) {
            console.error("Error getting sale:", error);
            throw error;
        }
    });
    electron_1.ipcMain.handle("sales:getByCashRegister", (_event, cashRegisterId) => {
        try {
            return sales_repository_js_1.salesRepository.getByCashRegister(cashRegisterId);
        }
        catch (error) {
            console.error("Error getting sales by register:", error);
            throw error;
        }
    });
    electron_1.ipcMain.handle("sales:getToday", () => {
        try {
            return sales_repository_js_1.salesRepository.getToday();
        }
        catch (error) {
            console.error("Error getting today sales:", error);
            throw error;
        }
    });
    electron_1.ipcMain.handle("sales:cancel", (_event, id) => {
        try {
            return sales_repository_js_1.salesRepository.cancel(id);
        }
        catch (error) {
            console.error("Error cancelling sale:", error);
            throw error;
        }
    });
    // ==================== CUSTOMERS ====================
    electron_1.ipcMain.handle('customers:getAll', () => {
        try {
            return customers_repository_js_1.customersRepository.getAll();
        }
        catch (error) {
            console.error('Error getting customers:', error);
            throw error;
        }
    });
    electron_1.ipcMain.handle('customers:search', (_event, term) => {
        try {
            return customers_repository_js_1.customersRepository.search(term);
        }
        catch (error) {
            console.error('Error searching customers:', error);
            throw error;
        }
    });
    electron_1.ipcMain.handle('customers:getById', (_event, id) => {
        try {
            return customers_repository_js_1.customersRepository.getById(id);
        }
        catch (error) {
            console.error('Error getting customer:', error);
            throw error;
        }
    });
    electron_1.ipcMain.handle('customers:getTodayBirthdays', () => {
        try {
            return customers_repository_js_1.customersRepository.getTodayBirthdays();
        }
        catch (error) {
            console.error('Error getting birthdays:', error);
            throw error;
        }
    });
    electron_1.ipcMain.handle('customers:getUpcomingBirthdays', (_event, days) => {
        try {
            return customers_repository_js_1.customersRepository.getUpcomingBirthdays(days);
        }
        catch (error) {
            console.error('Error getting upcoming birthdays:', error);
            throw error;
        }
    });
    electron_1.ipcMain.handle('customers:create', (_event, data) => {
        try {
            return customers_repository_js_1.customersRepository.create(data);
        }
        catch (error) {
            console.error('Error creating customer:', error);
            throw error;
        }
    });
    electron_1.ipcMain.handle('customers:update', (_event, { id, data }) => {
        try {
            return customers_repository_js_1.customersRepository.update(id, data);
        }
        catch (error) {
            console.error('Error updating customer:', error);
            throw error;
        }
    });
    electron_1.ipcMain.handle('customers:delete', (_event, id) => {
        try {
            return customers_repository_js_1.customersRepository.delete(id);
        }
        catch (error) {
            console.error('Error deleting customer:', error);
            throw error;
        }
    });
    electron_1.ipcMain.handle('customers:getPurchaseHistory', (_event, customerId) => {
        try {
            return customers_repository_js_1.customersRepository.getPurchaseHistory(customerId);
        }
        catch (error) {
            console.error('Error getting purchase history:', error);
            throw error;
        }
    });
    electron_1.ipcMain.handle('customers:getStats', (_event, customerId) => {
        try {
            return customers_repository_js_1.customersRepository.getCustomerStats(customerId);
        }
        catch (error) {
            console.error('Error getting customer stats:', error);
            throw error;
        }
    });
    // ==================== SUPPLIERS ====================
    electron_1.ipcMain.handle('suppliers:getAll', () => {
        try {
            return suppliers_repository_js_1.suppliersRepository.getAll();
        }
        catch (error) {
            console.error('Error getting suppliers:', error);
            throw error;
        }
    });
    electron_1.ipcMain.handle('suppliers:search', (_event, term) => {
        try {
            return suppliers_repository_js_1.suppliersRepository.search(term);
        }
        catch (error) {
            console.error('Error searching suppliers:', error);
            throw error;
        }
    });
    electron_1.ipcMain.handle('suppliers:getById', (_event, id) => {
        try {
            return suppliers_repository_js_1.suppliersRepository.getById(id);
        }
        catch (error) {
            console.error('Error getting supplier:', error);
            throw error;
        }
    });
    electron_1.ipcMain.handle('suppliers:getCategories', () => {
        try {
            return suppliers_repository_js_1.suppliersRepository.getCategories();
        }
        catch (error) {
            console.error('Error getting supplier categories:', error);
            throw error;
        }
    });
    electron_1.ipcMain.handle('suppliers:create', (_event, data) => {
        try {
            return suppliers_repository_js_1.suppliersRepository.create(data);
        }
        catch (error) {
            console.error('Error creating supplier:', error);
            throw error;
        }
    });
    electron_1.ipcMain.handle('suppliers:update', (_event, { id, data }) => {
        try {
            return suppliers_repository_js_1.suppliersRepository.update(id, data);
        }
        catch (error) {
            console.error('Error updating supplier:', error);
            throw error;
        }
    });
    electron_1.ipcMain.handle('suppliers:delete', (_event, id) => {
        try {
            return suppliers_repository_js_1.suppliersRepository.delete(id);
        }
        catch (error) {
            console.error('Error deleting supplier:', error);
            throw error;
        }
    });
    // ==================== REPORTS ====================
    electron_1.ipcMain.handle('reports:getSalesReport', (_event, startDate, endDate) => {
        try {
            return reports_repository_js_1.reportsRepository.getSalesReport(startDate, endDate);
        }
        catch (error) {
            console.error('Error getting sales report:', error);
            throw error;
        }
    });
    electron_1.ipcMain.handle('reports:getSalesForExport', (_event, startDate, endDate) => {
        try {
            return reports_repository_js_1.reportsRepository.getSalesForExport(startDate, endDate);
        }
        catch (error) {
            console.error('Error getting sales for export:', error);
            throw error;
        }
    });
    // ==================== RESERVE FUND (CAJA RESERVA) ====================
    electron_1.ipcMain.handle('reserve:getBalance', () => {
        try {
            return reserve_fund_repository_js_1.reserveFundRepository.getBalance();
        }
        catch (error) {
            console.error('Error getting reserve balance:', error);
            throw error;
        }
    });
    electron_1.ipcMain.handle('reserve:getAll', (_event, limit) => {
        try {
            return reserve_fund_repository_js_1.reserveFundRepository.getAll(limit);
        }
        catch (error) {
            console.error('Error getting reserve movements:', error);
            throw error;
        }
    });
    electron_1.ipcMain.handle('reserve:getCategories', () => {
        try {
            return reserve_fund_repository_js_1.reserveFundRepository.getCategories();
        }
        catch (error) {
            console.error('Error getting reserve categories:', error);
            throw error;
        }
    });
    electron_1.ipcMain.handle('reserve:getSummary', () => {
        try {
            return reserve_fund_repository_js_1.reserveFundRepository.getSummary();
        }
        catch (error) {
            console.error('Error getting reserve summary:', error);
            throw error;
        }
    });
    electron_1.ipcMain.handle('reserve:getSummaryByCategory', () => {
        try {
            return reserve_fund_repository_js_1.reserveFundRepository.getSummaryByCategory();
        }
        catch (error) {
            console.error('Error getting reserve summary by category:', error);
            throw error;
        }
    });
    electron_1.ipcMain.handle('reserve:transferFromCash', (_event, { cashRegisterId, amount, concept, category }) => {
        try {
            return reserve_fund_repository_js_1.reserveFundRepository.transferFromCashRegister(cashRegisterId, amount, concept, category);
        }
        catch (error) {
            console.error('Error transferring to reserve:', error);
            throw error;
        }
    });
    electron_1.ipcMain.handle('reserve:addExpense', (_event, data) => {
        try {
            return reserve_fund_repository_js_1.reserveFundRepository.addExpense(data);
        }
        catch (error) {
            console.error('Error adding reserve expense:', error);
            throw error;
        }
    });
    electron_1.ipcMain.handle('reserve:addIncome', (_event, data) => {
        try {
            return reserve_fund_repository_js_1.reserveFundRepository.addIncome(data);
        }
        catch (error) {
            console.error('Error adding reserve income:', error);
            throw error;
        }
    });
    electron_1.ipcMain.handle('reserve:delete', (_event, id) => {
        try {
            return reserve_fund_repository_js_1.reserveFundRepository.delete(id);
        }
        catch (error) {
            console.error('Error deleting reserve movement:', error);
            throw error;
        }
    });
    electron_1.ipcMain.handle('dashboard:getStats', () => {
        try {
            return dashboard_repository_js_1.dashboardRepository.getStats();
        }
        catch (error) {
            console.error('Error getting dashboard stats:', error);
            throw error;
        }
    });
    // ==================== SETTINGS ====================
    electron_1.ipcMain.handle('settings:getAll', () => {
        try {
            return settings_repository_js_1.settingsRepository.getAll();
        }
        catch (error) {
            console.error('Error getting settings:', error);
            throw error;
        }
    });
    electron_1.ipcMain.handle('settings:saveAll', (_event, settings) => {
        try {
            return settings_repository_js_1.settingsRepository.saveAll(settings);
        }
        catch (error) {
            console.error('Error saving settings:', error);
            throw error;
        }
    });
    electron_1.ipcMain.handle('settings:get', (_event, key) => {
        try {
            return settings_repository_js_1.settingsRepository.get(key);
        }
        catch (error) {
            console.error('Error getting setting:', error);
            throw error;
        }
    });
    electron_1.ipcMain.handle('settings:set', (_event, key, value) => {
        try {
            return settings_repository_js_1.settingsRepository.set(key, value);
        }
        catch (error) {
            console.error('Error setting value:', error);
            throw error;
        }
    });
    electron_1.ipcMain.handle('reports:exportExcel', async (_, startDate, endDate) => {
        const sales = reports_repository_js_1.reportsRepository.getSalesForExport(startDate, endDate);
        const filePath = await (0, excel_service_1.generateSalesExcel)(sales, startDate, endDate);
        return filePath;
    });
    // Image handlers
    electron_1.ipcMain.handle('images:select', async () => {
        return await (0, image_service_js_1.selectProductImage)();
    });
    electron_1.ipcMain.handle('images:save', async (_, sourcePath) => {
        return (0, image_service_js_1.saveProductImage)(sourcePath);
    });
    electron_1.ipcMain.handle('images:delete', async (_, imagePath) => {
        return (0, image_service_js_1.deleteProductImage)(imagePath);
    });
    electron_1.ipcMain.handle('images:getBase64', async (_, imagePath) => {
        return (0, image_service_js_1.getImageAsBase64)(imagePath);
    });
    console.log('✅ IPC handlers registrados (completo)');
}
electron_1.ipcMain.handle('cash:exportExcel', async (_, registerId) => {
    const movements = cash_register_repository_js_1.cashRegisterRepository.getMovementsByRegister(registerId);
    const summary = cash_register_repository_js_1.cashRegisterRepository.getClosingSummary(registerId);
    const register = cash_register_repository_js_1.cashRegisterRepository.getById(registerId);
    if (!summary || !register)
        return null;
    const registerDate = new Date(register.openedAt).toLocaleDateString('es-AR').replace(/\//g, '-');
    const summaryExport = {
        openingAmount: summary.cashFlow.opening,
        salesCash: summary.cashFlow.salesCash,
        income: summary.cashFlow.income,
        expense: summary.cashFlow.expense,
        expected: summary.cashFlow.expected,
        salesDebit: summary.electronic.debit.total,
        salesCredit: summary.electronic.credit.total,
        salesTransfer: summary.electronic.transfer.total,
    };
    return await (0, excel_service_1.generateCashRegisterExcel)(movements, summaryExport, registerDate);
});
electron_1.ipcMain.handle('reserve:exportExcel', async () => {
    const movements = reserve_fund_repository_js_1.reserveFundRepository.getAll(500);
    const summary = reserve_fund_repository_js_1.reserveFundRepository.getSummary();
    return await (0, excel_service_1.generateReserveExcel)(movements, summary);
});
