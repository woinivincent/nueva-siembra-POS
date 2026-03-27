// electron/preload.ts
const { contextBridge, ipcRenderer } = require('electron') as typeof import('electron');

// ==================== INTERFACES ====================
interface Product {
  id: number;
  name: string;
  description: string | null;
  barcode: string | null;
  category: string;
  price: number;
  cost: number | null;
  stock: number;
  stockMin: number | null;
  unit: "ud" | "kg";
  image: string | null;
  isActive: boolean;
  isFavorite: boolean;
  favoriteKey: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

interface CashRegister {
  id: number;
  openedAt: Date;
  closedAt: Date | null;
  openingAmount: number;
  closingAmount: number | null;
  expectedAmount: number | null;
  difference: number | null;
  status: "open" | "closed";
  userId: number | null;
  notes: string | null;
}

interface CashMovement {
  id: number;
  cashRegisterId: number;
  type: "income" | "expense" | "sale";
  amount: number;
  concept: string;
  description: string | null;
  paymentMethod: "cash" | "transfer";
  createdAt: Date;
}

interface PaymentMethodSummary {
  count: number;
  total: number;
}

interface SalesByPaymentMethod {
  cash: PaymentMethodSummary;
  debit: PaymentMethodSummary;
  credit: PaymentMethodSummary;
  transfer: PaymentMethodSummary;
}

interface ClosingSummary {
  register: CashRegister;
  cashFlow: {
    opening: number;
    salesCash: number;
    income: number;
    expense: number;
    expected: number;
  };
  electronic: {
    debit: PaymentMethodSummary;
    credit: PaymentMethodSummary;
    transfer: PaymentMethodSummary;
    total: number;
  };
  totalSales: number;
  totalTransactions: number;
  movements: {
    totalIncome: number;
    totalExpense: number;
  };
}

// ==================== API ====================
const electronAPI = {
  // Products
  products: {
    getAll: (): Promise<Product[]> => ipcRenderer.invoke("products:getAll"),
    search: (term: string): Promise<Product[]> =>
      ipcRenderer.invoke("products:search", term),
    getById: (id: number): Promise<Product | null> =>
      ipcRenderer.invoke("products:getById", id),
    getByBarcode: (barcode: string): Promise<Product | null> =>
      ipcRenderer.invoke("products:getByBarcode", barcode),
    getFavorites: (): Promise<Product[]> =>
      ipcRenderer.invoke("products:getFavorites"),
    getByCategory: (category: string): Promise<Product[]> =>
      ipcRenderer.invoke("products:getByCategory", category),
    getCategories: (): Promise<string[]> =>
      ipcRenderer.invoke("products:getCategories"),
    getLowStock: (): Promise<Product[]> =>
      ipcRenderer.invoke("products:getLowStock"),
    create: (data: Partial<Product>): Promise<Product> =>
      ipcRenderer.invoke("products:create", data),
    update: (id: number, data: Partial<Product>): Promise<Product> =>
      ipcRenderer.invoke("products:update", { id, data }),
    delete: (id: number): Promise<{ success: boolean }> =>
      ipcRenderer.invoke("products:delete", id),
  },

  // Cash Register
  cash: {
    getOpen: (): Promise<CashRegister | null> =>
      ipcRenderer.invoke("cash:getOpen"),
    open: (openingAmount: number, userId?: number): Promise<CashRegister> =>
      ipcRenderer.invoke("cash:open", openingAmount, userId),
    close: (
      id: number,
      closingAmount: number,
      notes?: string
    ): Promise<CashRegister> =>
      ipcRenderer.invoke("cash:close", id, closingAmount, notes),
    getClosingSummary: (registerId: number): Promise<ClosingSummary | null> =>
      ipcRenderer.invoke("cash:getClosingSummary", registerId),
    getHistory: (limit?: number): Promise<CashRegister[]> =>
      ipcRenderer.invoke("cash:getHistory", limit),
    getMovements: (registerId: number): Promise<CashMovement[]> =>
      ipcRenderer.invoke("cash:getMovements", registerId),
    addMovement: (data: {
      cashRegisterId: number;
      type: "income" | "expense";
      amount: number;
      concept: string;
      description?: string;
      paymentMethod?: "cash" | "transfer";
    }): Promise<CashMovement> => ipcRenderer.invoke("cash:addMovement", data),
    deleteMovement: (id: number): Promise<boolean> =>
      ipcRenderer.invoke("cash:deleteMovement", id),
    getSalesByPaymentMethod: (
      registerId: number
    ): Promise<SalesByPaymentMethod> =>
      ipcRenderer.invoke("cash:getSalesByPaymentMethod", registerId),
      exportExcel: (registerId: number) => ipcRenderer.invoke('cash:exportExcel', registerId),
  },

  // Sales
  sales: {
    create: (data: {
      customerId?: number;
      cashRegisterId?: number;
      subtotal: number;
      tax: number;
      discount: number;
      total: number;
      paymentMethod: "cash" | "debit" | "credit" | "transfer";
      payments?: { method: "cash" | "debit" | "credit" | "transfer"; amount: number }[];
      items: {
        productId: number;
        quantity: number;
        price: number;
        discount?: number;
        subtotal: number;
      }[];
    }): Promise<any> => ipcRenderer.invoke("sales:create", data),
    getById: (id: number): Promise<any> =>
      ipcRenderer.invoke("sales:getById", id),
    getByCashRegister: (cashRegisterId: number): Promise<any> =>
      ipcRenderer.invoke("sales:getByCashRegister", cashRegisterId),
    getToday: (): Promise<any> => ipcRenderer.invoke("sales:getToday"),
    cancel: (id: number): Promise<boolean> =>
      ipcRenderer.invoke("sales:cancel", id),
  },

  // Customers
  customers: {
    getAll: (): Promise<any[]> => ipcRenderer.invoke("customers:getAll"),
    search: (term: string): Promise<any[]> =>
      ipcRenderer.invoke("customers:search", term),
    getById: (id: number): Promise<any> =>
      ipcRenderer.invoke("customers:getById", id),
    getTodayBirthdays: (): Promise<any[]> =>
      ipcRenderer.invoke("customers:getTodayBirthdays"),
    getUpcomingBirthdays: (days?: number): Promise<any[]> =>
      ipcRenderer.invoke("customers:getUpcomingBirthdays", days),
    create: (data: any): Promise<any> =>
      ipcRenderer.invoke("customers:create", data),
    update: (id: number, data: any): Promise<any> =>
      ipcRenderer.invoke("customers:update", { id, data }),
    delete: (id: number): Promise<boolean> =>
      ipcRenderer.invoke("customers:delete", id),
    getPurchaseHistory: (customerId: number): Promise<any[]> =>
      ipcRenderer.invoke("customers:getPurchaseHistory", customerId),
    getStats: (customerId: number): Promise<any> =>
      ipcRenderer.invoke("customers:getStats", customerId),
  },

  // Suppliers
  suppliers: {
    getAll: (): Promise<any[]> => ipcRenderer.invoke("suppliers:getAll"),
    search: (term: string): Promise<any[]> =>
      ipcRenderer.invoke("suppliers:search", term),
    getById: (id: number): Promise<any> =>
      ipcRenderer.invoke("suppliers:getById", id),
    getCategories: (): Promise<string[]> =>
      ipcRenderer.invoke("suppliers:getCategories"),
    create: (data: any): Promise<any> =>
      ipcRenderer.invoke("suppliers:create", data),
    update: (id: number, data: any): Promise<any> =>
      ipcRenderer.invoke("suppliers:update", { id, data }),
    delete: (id: number): Promise<boolean> =>
      ipcRenderer.invoke("suppliers:delete", id),
  },

  // Reports
  reports: {
    getSalesReport: (startDate: string, endDate: string): Promise<any> =>
      ipcRenderer.invoke("reports:getSalesReport", startDate, endDate),
    getSalesForExport: (startDate: string, endDate: string): Promise<any[]> =>
      ipcRenderer.invoke("reports:getSalesForExport", startDate, endDate),
    exportExcel: (startDate: string, endDate: string) => ipcRenderer.invoke('reports:exportExcel', startDate, endDate),
    getExpensesReport: (startDate: string, endDate: string): Promise<any> =>
      ipcRenderer.invoke("reports:getExpensesReport", startDate, endDate),
  },
  // Reserve Fund (Caja Reserva)
reserve: {
  getBalance: (): Promise<number> => ipcRenderer.invoke('reserve:getBalance'),
  getAll: (limit?: number): Promise<any[]> => ipcRenderer.invoke('reserve:getAll', limit),
  getCategories: (): Promise<string[]> => ipcRenderer.invoke('reserve:getCategories'),
  getSummary: (): Promise<any> => ipcRenderer.invoke('reserve:getSummary'),
  getSummaryByCategory: (): Promise<any[]> => ipcRenderer.invoke('reserve:getSummaryByCategory'),
  transferFromCash: (data: { cashRegisterId: number; amount: number; concept: string; category?: string }): Promise<any> =>
    ipcRenderer.invoke('reserve:transferFromCash', data),
  addExpense: (data: { amount: number; concept: string; category?: string; description?: string }): Promise<any> =>
    ipcRenderer.invoke('reserve:addExpense', data),
  addIncome: (data: { amount: number; concept: string; category?: string; description?: string }): Promise<any> =>
    ipcRenderer.invoke('reserve:addIncome', data),
  delete: (id: number): Promise<boolean> => ipcRenderer.invoke('reserve:delete', id),
  exportExcel: () => ipcRenderer.invoke('reserve:exportExcel'),
},
dashboard: {
  getStats: (): Promise<any> => ipcRenderer.invoke('dashboard:getStats'),
},
// Settings
settings: {
  getAll: (): Promise<any> => ipcRenderer.invoke('settings:getAll'),
  saveAll: (settings: any): Promise<boolean> => ipcRenderer.invoke('settings:saveAll', settings),
  get: (key: string): Promise<string | null> => ipcRenderer.invoke('settings:get', key),
  set: (key: string, value: string): Promise<boolean> => ipcRenderer.invoke('settings:set', key, value),
},
images: {
  select: () => ipcRenderer.invoke('images:select'),
  save: (sourcePath: string) => ipcRenderer.invoke('images:save', sourcePath),
  delete: (imagePath: string) => ipcRenderer.invoke('images:delete', imagePath),
  getBase64: (imagePath: string) => ipcRenderer.invoke('images:getBase64', imagePath),
},
};

contextBridge.exposeInMainWorld("electronAPI", electronAPI);