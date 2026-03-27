"use strict";
// electron/preload.ts
const { contextBridge, ipcRenderer } = require('electron');
// ==================== API ====================
const electronAPI = {
    // Products
    products: {
        getAll: () => ipcRenderer.invoke("products:getAll"),
        search: (term) => ipcRenderer.invoke("products:search", term),
        getById: (id) => ipcRenderer.invoke("products:getById", id),
        getByBarcode: (barcode) => ipcRenderer.invoke("products:getByBarcode", barcode),
        getFavorites: () => ipcRenderer.invoke("products:getFavorites"),
        getByCategory: (category) => ipcRenderer.invoke("products:getByCategory", category),
        getCategories: () => ipcRenderer.invoke("products:getCategories"),
        getLowStock: () => ipcRenderer.invoke("products:getLowStock"),
        create: (data) => ipcRenderer.invoke("products:create", data),
        update: (id, data) => ipcRenderer.invoke("products:update", { id, data }),
        delete: (id) => ipcRenderer.invoke("products:delete", id),
    },
    // Cash Register
    cash: {
        getOpen: () => ipcRenderer.invoke("cash:getOpen"),
        open: (openingAmount, userId) => ipcRenderer.invoke("cash:open", openingAmount, userId),
        close: (id, closingAmount, notes) => ipcRenderer.invoke("cash:close", id, closingAmount, notes),
        getClosingSummary: (registerId) => ipcRenderer.invoke("cash:getClosingSummary", registerId),
        getHistory: (limit) => ipcRenderer.invoke("cash:getHistory", limit),
        getMovements: (registerId) => ipcRenderer.invoke("cash:getMovements", registerId),
        addMovement: (data) => ipcRenderer.invoke("cash:addMovement", data),
        deleteMovement: (id) => ipcRenderer.invoke("cash:deleteMovement", id),
        getSalesByPaymentMethod: (registerId) => ipcRenderer.invoke("cash:getSalesByPaymentMethod", registerId),
        exportExcel: (registerId) => ipcRenderer.invoke('cash:exportExcel', registerId),
    },
    // Sales
    sales: {
        create: (data) => ipcRenderer.invoke("sales:create", data),
        getById: (id) => ipcRenderer.invoke("sales:getById", id),
        getByCashRegister: (cashRegisterId) => ipcRenderer.invoke("sales:getByCashRegister", cashRegisterId),
        getToday: () => ipcRenderer.invoke("sales:getToday"),
        cancel: (id) => ipcRenderer.invoke("sales:cancel", id),
    },
    // Customers
    customers: {
        getAll: () => ipcRenderer.invoke("customers:getAll"),
        search: (term) => ipcRenderer.invoke("customers:search", term),
        getById: (id) => ipcRenderer.invoke("customers:getById", id),
        getTodayBirthdays: () => ipcRenderer.invoke("customers:getTodayBirthdays"),
        getUpcomingBirthdays: (days) => ipcRenderer.invoke("customers:getUpcomingBirthdays", days),
        create: (data) => ipcRenderer.invoke("customers:create", data),
        update: (id, data) => ipcRenderer.invoke("customers:update", { id, data }),
        delete: (id) => ipcRenderer.invoke("customers:delete", id),
        getPurchaseHistory: (customerId) => ipcRenderer.invoke("customers:getPurchaseHistory", customerId),
        getStats: (customerId) => ipcRenderer.invoke("customers:getStats", customerId),
    },
    // Suppliers
    suppliers: {
        getAll: () => ipcRenderer.invoke("suppliers:getAll"),
        search: (term) => ipcRenderer.invoke("suppliers:search", term),
        getById: (id) => ipcRenderer.invoke("suppliers:getById", id),
        getCategories: () => ipcRenderer.invoke("suppliers:getCategories"),
        create: (data) => ipcRenderer.invoke("suppliers:create", data),
        update: (id, data) => ipcRenderer.invoke("suppliers:update", { id, data }),
        delete: (id) => ipcRenderer.invoke("suppliers:delete", id),
    },
    // Reports
    reports: {
        getSalesReport: (startDate, endDate) => ipcRenderer.invoke("reports:getSalesReport", startDate, endDate),
        getSalesForExport: (startDate, endDate) => ipcRenderer.invoke("reports:getSalesForExport", startDate, endDate),
        exportExcel: (startDate, endDate) => ipcRenderer.invoke('reports:exportExcel', startDate, endDate),
    },
    // Reserve Fund (Caja Reserva)
    reserve: {
        getBalance: () => ipcRenderer.invoke('reserve:getBalance'),
        getAll: (limit) => ipcRenderer.invoke('reserve:getAll', limit),
        getCategories: () => ipcRenderer.invoke('reserve:getCategories'),
        getSummary: () => ipcRenderer.invoke('reserve:getSummary'),
        getSummaryByCategory: () => ipcRenderer.invoke('reserve:getSummaryByCategory'),
        transferFromCash: (data) => ipcRenderer.invoke('reserve:transferFromCash', data),
        addExpense: (data) => ipcRenderer.invoke('reserve:addExpense', data),
        addIncome: (data) => ipcRenderer.invoke('reserve:addIncome', data),
        delete: (id) => ipcRenderer.invoke('reserve:delete', id),
        exportExcel: () => ipcRenderer.invoke('reserve:exportExcel'),
    },
    dashboard: {
        getStats: () => ipcRenderer.invoke('dashboard:getStats'),
    },
    // Settings
    settings: {
        getAll: () => ipcRenderer.invoke('settings:getAll'),
        saveAll: (settings) => ipcRenderer.invoke('settings:saveAll', settings),
        get: (key) => ipcRenderer.invoke('settings:get', key),
        set: (key, value) => ipcRenderer.invoke('settings:set', key, value),
    },
    images: {
        select: () => ipcRenderer.invoke('images:select'),
        save: (sourcePath) => ipcRenderer.invoke('images:save', sourcePath),
        delete: (imagePath) => ipcRenderer.invoke('images:delete', imagePath),
        getBase64: (imagePath) => ipcRenderer.invoke('images:getBase64', imagePath),
    },
};
contextBridge.exposeInMainWorld("electronAPI", electronAPI);
