// electron/preload.ts
const { contextBridge, ipcRenderer } = require('electron') as typeof import('electron');

// ==================== INTERFACES ====================
type ExpenseType = "business" | "salary";
type ExpensePaymentMethod = "cash" | "transfer";

interface Expense {
  id: number;
  type: ExpenseType;
  amount: number;
  concept: string;
  description: string | null;
  paymentMethod: ExpensePaymentMethod;
  date: Date;
  createdAt: Date | null;
}

interface ExpensesSummary {
  total: number;
  business: number;
  salary: number;
  totalCash: number;
  totalTransfer: number;
  expenses: Expense[];
}

interface Product {
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
  unit: "ud" | "kg";
  image: string | null;
  isActive: boolean;
  createdAt: Date | null;
  updatedAt: Date | null;
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

  // Egresos
  expenses: {
    getAll: (limit?: number): Promise<Expense[]> =>
      ipcRenderer.invoke("expenses:getAll", limit),
    getByDateRange: (startDate: string, endDate: string): Promise<Expense[]> =>
      ipcRenderer.invoke("expenses:getByDateRange", startDate, endDate),
    getSummary: (startDate: string, endDate: string): Promise<ExpensesSummary> =>
      ipcRenderer.invoke("expenses:getSummary", startDate, endDate),
    create: (data: {
      type: ExpenseType;
      amount: number;
      concept: string;
      description?: string | null;
      paymentMethod: ExpensePaymentMethod;
      date?: string;
    }): Promise<Expense | null> => ipcRenderer.invoke("expenses:create", data),
    delete: (id: number): Promise<boolean> =>
      ipcRenderer.invoke("expenses:delete", id),
  },

  sales: {
    create: (data: {
      customerId?: number;
      subtotal: number;
      tax: number;
      discount: number;
      total: number;
      paymentMethod: "cash" | "transfer";
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
    getByDateRange: (
      startDate: string,
      endDate: string,
      includeCancelled?: boolean,
    ): Promise<any[]> =>
      ipcRenderer.invoke("sales:getByDateRange", startDate, endDate, includeCancelled),
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
    getExpensesReport: (startDate: string, endDate: string): Promise<ExpensesSummary> =>
      ipcRenderer.invoke("reports:getExpensesReport", startDate, endDate),
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