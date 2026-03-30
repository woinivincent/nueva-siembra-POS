// src/shared/types/electron.d.ts
export interface Product {
  id: number;
  name: string;
  description: string | null;
  barcode: string | null;
  category: string;
  price: number;
  priceCard: number;
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

export interface CashRegister {
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

export interface CashMovement {
  id: number;
  cashRegisterId: number;
  type: "income" | "expense" | "sale";
  amount: number;
  concept: string;
  description: string | null;
  createdAt: Date;
}

export interface PaymentMethodSummary {
  count: number;
  total: number;
}

export interface SalesByPaymentMethod {
  cash: PaymentMethodSummary;
  debit: PaymentMethodSummary;
  credit: PaymentMethodSummary;
  transfer: PaymentMethodSummary;
}

export interface ClosingSummary {
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

// ==================== SALES ====================
export interface SaleItem {
  id: number;
  saleId: number;
  productId: number;
  productName?: string;
  quantity: number;
  price: number;
  discount: number;
  subtotal: number;
}

export interface SalePayment {
  id: number;
  saleId: number;
  paymentMethod: "cash" | "debit" | "credit" | "transfer";
  amount: number;
  createdAt: Date;
}

export interface Sale {
  id: number;
  customerId: number | null;
  cashRegisterId: number | null;
  subtotal: number;
  tax: number;
 
  discount: number;
  total: number;
  paymentMethod: "cash" | "debit" | "credit" | "transfer" | "mixed";
  status: "completed" | "suspended" | "cancelled";
  createdAt: Date;
  userId: number | null;
  items?: SaleItem[];
  payments?: SalePayment[];
}

export interface PaymentDetail {
  method: "cash" | "debit" | "credit" | "transfer";
  amount: number;
}

export interface CreateSaleData {
  customerId?: number;
  cashRegisterId?: number;
  subtotal: number;
  tax: number;
 
  discount: number;
  total: number;
  paymentMethod: "cash" | "debit" | "credit" | "transfer";
  payments?: PaymentDetail[];
  items: {
    productId: number;
    quantity: number;
    price: number;
    discount?: number;
    subtotal: number;
  }[];
}

// ==================== ELECTRON API ====================
export interface ElectronAPI {
  products: {
    getAll: () => Promise<Product[]>;
    search: (term: string) => Promise<Product[]>;
    getById: (id: number) => Promise<Product | null>;
    getByBarcode: (barcode: string) => Promise<Product | null>;
    getFavorites: () => Promise<Product[]>;
    getByCategory: (category: string) => Promise<Product[]>;
    getCategories: () => Promise<string[]>;
    getLowStock: () => Promise<Product[]>;
    create: (data: Partial<Product>) => Promise<Product>;
    update: (id: number, data: Partial<Product>) => Promise<Product>;
    delete: (id: number) => Promise<{ success: boolean }>;
  };
  cash: {
    getOpen: () => Promise<CashRegister | null>;
    open: (openingAmount: number, userId?: number) => Promise<CashRegister>;
    close: (
      id: number,
      closingAmount: number,
      notes?: string,
    ) => Promise<CashRegister>;
    getClosingSummary: (registerId: number) => Promise<ClosingSummary | null>;
    getHistory: (limit?: number) => Promise<CashRegister[]>;
    getMovements: (registerId: number) => Promise<CashMovement[]>;
    addMovement: (data: {
      cashRegisterId: number;
      type: "income" | "expense";
      amount: number;
      concept: string;
      description?: string;
      paymentMethod?: "cash" | "transfer";
    }) => Promise<CashMovement>;
    deleteMovement: (id: number) => Promise<boolean>;
    getSalesByPaymentMethod: (
      registerId: number,
    ) => Promise<SalesByPaymentMethod>;
    exportExcel: (registerId: number) => Promise<string | null>;
  };
  sales: {
    create: (data: CreateSaleData) => Promise<Sale>;
    getById: (id: number) => Promise<Sale | null>;
    getByCashRegister: (cashRegisterId: number) => Promise<Sale[]>;
    getToday: () => Promise<Sale[]>;
    cancel: (id: number) => Promise<boolean>;
  };
  customers: {
    getAll: () => Promise<Customer[]>;
    search: (term: string) => Promise<Customer[]>;
    getById: (id: number) => Promise<Customer | null>;
    getTodayBirthdays: () => Promise<Customer[]>;
    getUpcomingBirthdays: (days?: number) => Promise<Customer[]>;
    create: (data: {
      firstName: string;
      lastName: string;
      phone?: string;
      email?: string;
      birthDate?: string;
      occupation?: string;
    }) => Promise<Customer>;
    update: (
      id: number,
      data: Partial<{
        firstName: string;
        lastName: string;
        phone: string;
        email: string;
        birthDate: string;
        occupation: string;
      }>,
    ) => Promise<Customer>;
    delete: (id: number) => Promise<boolean>;
    getPurchaseHistory: (customerId: number) => Promise<CustomerPurchase[]>;
    getStats: (customerId: number) => Promise<CustomerStats>;
  }; suppliers: {
    getAll: () => Promise<Supplier[]>;
    search: (term: string) => Promise<Supplier[]>;
    getById: (id: number) => Promise<Supplier | null>;
    getCategories: () => Promise<string[]>;
    create: (data: {
      companyName: string;
      contactName?: string;
      phone?: string;
      email?: string;
      category?: string;
    }) => Promise<Supplier>;
    update: (id: number, data: Partial<{
      companyName: string;
      contactName: string;
      phone: string;
      email: string;
      category: string;
    }>) => Promise<Supplier>;
    delete: (id: number) => Promise<boolean>;
  };
    reserve: {
    getBalance: () => Promise<number>;
    getAll: (limit?: number) => Promise<ReserveMovement[]>;
    getCategories: () => Promise<string[]>;
    getSummary: () => Promise<ReserveSummary>;
    getSummaryByCategory: () => Promise<ReserveCategorySummary[]>;
    transferFromCash: (data: {
      cashRegisterId: number;
      amount: number;
      concept: string;
      category?: string;
    }) => Promise<ReserveMovement>;
    addExpense: (data: {
      amount: number;
      concept: string;
      category?: string;
      description?: string;
    }) => Promise<ReserveMovement>;
    addIncome: (data: {
      amount: number;
      concept: string;
      category?: string;
      description?: string;
    }) => Promise<ReserveMovement>;
    delete: (id: number) => Promise<boolean>;
    exportExcel: () => Promise<string | null>;
  };


  reports: {
    getSalesReport: (startDate: string, endDate: string) => Promise<SalesReportSummary>;
    getSalesForExport: (startDate: string, endDate: string) => Promise<any[]>;
    exportExcel: (startDate: string, endDate: string) => Promise<string>;
    getExpensesReport: (startDate: string, endDate: string) => Promise<any>;
  };
  dashboard: {
  getStats: () => Promise<DashboardStats>;
  };
  settings: {
  getAll: () => Promise<AppSettings>;
  saveAll: (settings: Partial<AppSettings>) => Promise<boolean>;
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string) => Promise<boolean>;
};
images: {
  select: () => Promise<string | null>;
  save: (sourcePath: string) => Promise<string>;
  delete: (imagePath: string) => Promise<boolean>;
  getBase64: (imagePath: string) => Promise<string | null>;
};
} // ==================== CUSTOMERS ====================
export interface Customer {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  birthDate: string | null;
  occupation: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerStats {
  totalPurchases: number;
  totalSpent: number;
  lastPurchase: Date | null;
}

export interface CustomerPurchase {
  id: number;
  total: number;
  paymentMethod: string;
  itemsCount: number;
  createdAt: Date;
}
// ==================== SUPPLIERS ====================
export interface Supplier {
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

// ==================== REPORTS ====================
export interface SalesReportItem {
  date: string;
  totalSales: number;
  totalTransactions: number;
  avgTicket: number;
  cash: number;
  debit: number;
  credit: number;
  transfer: number;
}

export interface TopProductItem {
  productId: number;
  productName: string;
  category: string;
  quantitySold: number;
  totalRevenue: number;
  avgPrice: number;
}

export interface SalesReportSummary {
  totalSales: number;
  totalTransactions: number;
  avgTicket: number;
  byPaymentMethod: {
    cash: number;
    debit: number;
    credit: number;
    transfer: number;
  };
  topProducts: TopProductItem[];
  dailyData: SalesReportItem[];
}
//==================== RESERVE FUND ====================//
export interface ReserveMovement {
  id: number;
  type: 'income' | 'expense';
  amount: number;
  concept: string;
  category: string | null;
  description: string | null;
  sourceCashRegisterId: number | null;
  createdAt: Date;
}

export interface ReserveSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  movementsCount: number;
}

export interface ReserveCategorySummary {
  category: string;
  income: number;
  expense: number;
  balance: number;
}
// ==================== DASHBOARD ====================
export interface DashboardStats {
  todaySales: number;
  todayTransactions: number;
  todayAvgTicket: number;
  yesterdaySales: number;
  salesGrowth: number;
  todayByPayment: {
    cash: number;
    debit: number;
    credit: number;
    transfer: number;
  };
  topProducts: {
    id: number;
    name: string;
    quantity: number;
    total: number;
  }[];
  lowStockProducts: {
    id: number;
    name: string;
    stock: number;
    stockMin: number;
  }[];
  cashRegister: {
    isOpen: boolean;
    openingAmount: number;
    currentAmount: number;
    salesCount: number;
  } | null;
  todayBirthdays: {
    id: number;
    fullName: string;
    phone: string | null;
  }[];
  monthSales: number;
  monthTransactions: number;
}
// ==================== SETTINGS ====================
export interface AppSettings {
  businessName: string;
  businessAddress: string;
  businessPhone: string;
  businessCuit: string;
  businessLogo: string | null;
  cardSurcharge: number;
  currency: string;
  currencySymbol: string;
  ticketHeader: string;
  ticketFooter: string;
  theme: 'light' | 'dark';
  lowStockAlert: number;
}
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
