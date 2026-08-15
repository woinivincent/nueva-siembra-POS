// electron/ipc/handlers.ts
import { ipcMain } from "electron";
import { productsRepository } from "../repositories/products.repository.js";
import { expensesRepository } from "../repositories/expenses.repository.js";
import { salesRepository } from "../repositories/sales.repository.js";
import { customersRepository } from '../repositories/customers.repository.js';
import { suppliersRepository } from '../repositories/suppliers.repository.js';
import { reportsRepository } from '../repositories/reports.repository.js';
import { dashboardRepository } from '../repositories/dashboard.repository.js';
import { settingsRepository } from '../repositories/settings.repository.js';
import { generateSalesExcel } from '../services/excel.service';
import { selectProductImage, saveProductImage, deleteProductImage, getImageAsBase64 } from '../services/image.service.js';

export function registerIpcHandlers() {
  // ==================== PRODUCTS ====================
  ipcMain.handle("products:getAll", () => {
    try {
      return productsRepository.getAll();
    } catch (error) {
      console.error("Error getting products:", error);
      throw error;
    }
  });

  ipcMain.handle("products:search", (_event, term: string) => {
    try {
      return productsRepository.search(term);
    } catch (error) {
      console.error("Error searching products:", error);
      throw error;
    }
  });

  ipcMain.handle("products:getById", (_event, id: number) => {
    try {
      return productsRepository.getById(id);
    } catch (error) {
      console.error("Error getting product by id:", error);
      throw error;
    }
  });

  ipcMain.handle("products:getByBarcode", (_event, barcode: string) => {
    try {
      return productsRepository.getByBarcode(barcode);
    } catch (error) {
      console.error("Error getting product by barcode:", error);
      throw error;
    }
  });

  ipcMain.handle("products:getFavorites", () => {
    try {
      return productsRepository.getFavorites();
    } catch (error) {
      console.error("Error getting favorites:", error);
      throw error;
    }
  });

  ipcMain.handle("products:getByCategory", (_event, category: string) => {
    try {
      return productsRepository.getByCategory(category);
    } catch (error) {
      console.error("Error getting products by category:", error);
      throw error;
    }
  });

  ipcMain.handle("products:getCategories", () => {
    try {
      return productsRepository.getCategories();
    } catch (error) {
      console.error("Error getting categories:", error);
      throw error;
    }
  });

  ipcMain.handle("products:getLowStock", () => {
    try {
      return productsRepository.getLowStock();
    } catch (error) {
      console.error("Error getting low stock products:", error);
      throw error;
    }
  });

  ipcMain.handle("products:create", (_event, data) => {
    try {
      return productsRepository.create(data);
    } catch (error) {
      console.error("Error creating product:", error);
      throw error;
    }
  });

  ipcMain.handle("products:update", (_event, { id, data }) => {
    try {
      return productsRepository.update(id, data);
    } catch (error) {
      console.error("Error updating product:", error);
      throw error;
    }
  });

  ipcMain.handle("products:delete", (_event, id: number) => {
    try {
      productsRepository.delete(id);
      return { success: true };
    } catch (error) {
      console.error("Error deleting product:", error);
      throw error;
    }
  });

  // ==================== EGRESOS ====================
  ipcMain.handle("expenses:getAll", (_event, limit?: number) => {
    try {
      return expensesRepository.getAll(limit);
    } catch (error) {
      console.error("Error getting expenses:", error);
      throw error;
    }
  });

  ipcMain.handle(
    "expenses:getByDateRange",
    (_event, startDate: string, endDate: string) => {
      try {
        return expensesRepository.getByDateRange(startDate, endDate);
      } catch (error) {
        console.error("Error getting expenses by date range:", error);
        throw error;
      }
    },
  );

  ipcMain.handle(
    "expenses:getSummary",
    (_event, startDate: string, endDate: string) => {
      try {
        return expensesRepository.getSummary(startDate, endDate);
      } catch (error) {
        console.error("Error getting expenses summary:", error);
        throw error;
      }
    },
  );

  ipcMain.handle("expenses:create", (_event, data) => {
    try {
      return expensesRepository.create(data);
    } catch (error) {
      console.error("Error creating expense:", error);
      throw error;
    }
  });

  ipcMain.handle("expenses:delete", (_event, id: number) => {
    try {
      return expensesRepository.delete(id);
    } catch (error) {
      console.error("Error deleting expense:", error);
      throw error;
    }
  });

  // ==================== SALES ====================
  ipcMain.handle("sales:create", (_event, data) => {
    try {
      return salesRepository.create(data);
    } catch (error) {
      console.error("Error creating sale:", error);
      throw error;
    }
  });

  ipcMain.handle("sales:getById", (_event, id: number) => {
    try {
      return salesRepository.getById(id);
    } catch (error) {
      console.error("Error getting sale:", error);
      throw error;
    }
  });

  ipcMain.handle(
    "sales:getByDateRange",
    (_event, startDate: string, endDate: string, includeCancelled?: boolean) => {
      try {
        return salesRepository.getByDateRange(startDate, endDate, includeCancelled);
      } catch (error) {
        console.error("Error getting sales by date range:", error);
        throw error;
      }
    },
  );

  ipcMain.handle("sales:getToday", () => {
    try {
      return salesRepository.getToday();
    } catch (error) {
      console.error("Error getting today sales:", error);
      throw error;
    }
  });

  ipcMain.handle("sales:cancel", (_event, id: number) => {
    try {
      return salesRepository.cancel(id);
    } catch (error) {
      console.error("Error cancelling sale:", error);
      throw error;
    }
  });

  // ==================== CUSTOMERS ====================
ipcMain.handle('customers:getAll', () => {
  try {
    return customersRepository.getAll();
  } catch (error) {
    console.error('Error getting customers:', error);
    throw error;
  }
});

ipcMain.handle('customers:search', (_event, term: string) => {
  try {
    return customersRepository.search(term);
  } catch (error) {
    console.error('Error searching customers:', error);
    throw error;
  }
});

ipcMain.handle('customers:getById', (_event, id: number) => {
  try {
    return customersRepository.getById(id);
  } catch (error) {
    console.error('Error getting customer:', error);
    throw error;
  }
});

ipcMain.handle('customers:getTodayBirthdays', () => {
  try {
    return customersRepository.getTodayBirthdays();
  } catch (error) {
    console.error('Error getting birthdays:', error);
    throw error;
  }
});

ipcMain.handle('customers:getUpcomingBirthdays', (_event, days?: number) => {
  try {
    return customersRepository.getUpcomingBirthdays(days);
  } catch (error) {
    console.error('Error getting upcoming birthdays:', error);
    throw error;
  }
});

ipcMain.handle('customers:create', (_event, data) => {
  try {
    return customersRepository.create(data);
  } catch (error) {
    console.error('Error creating customer:', error);
    throw error;
  }
});

ipcMain.handle('customers:update', (_event, { id, data }) => {
  try {
    return customersRepository.update(id, data);
  } catch (error) {
    console.error('Error updating customer:', error);
    throw error;
  }
});

ipcMain.handle('customers:delete', (_event, id: number) => {
  try {
    return customersRepository.delete(id);
  } catch (error) {
    console.error('Error deleting customer:', error);
    throw error;
  }
});

ipcMain.handle('customers:getPurchaseHistory', (_event, customerId: number) => {
  try {
    return customersRepository.getPurchaseHistory(customerId);
  } catch (error) {
    console.error('Error getting purchase history:', error);
    throw error;
  }
});

ipcMain.handle('customers:getStats', (_event, customerId: number) => {
  try {
    return customersRepository.getCustomerStats(customerId);
  } catch (error) {
    console.error('Error getting customer stats:', error);
    throw error;
  }
});
// ==================== SUPPLIERS ====================
ipcMain.handle('suppliers:getAll', () => {
  try {
    return suppliersRepository.getAll();
  } catch (error) {
    console.error('Error getting suppliers:', error);
    throw error;
  }
});

ipcMain.handle('suppliers:search', (_event, term: string) => {
  try {
    return suppliersRepository.search(term);
  } catch (error) {
    console.error('Error searching suppliers:', error);
    throw error;
  }
});

ipcMain.handle('suppliers:getById', (_event, id: number) => {
  try {
    return suppliersRepository.getById(id);
  } catch (error) {
    console.error('Error getting supplier:', error);
    throw error;
  }
});

ipcMain.handle('suppliers:getCategories', () => {
  try {
    return suppliersRepository.getCategories();
  } catch (error) {
    console.error('Error getting supplier categories:', error);
    throw error;
  }
});

ipcMain.handle('suppliers:create', (_event, data) => {
  try {
    return suppliersRepository.create(data);
  } catch (error) {
    console.error('Error creating supplier:', error);
    throw error;
  }
});

ipcMain.handle('suppliers:update', (_event, { id, data }) => {
  try {
    return suppliersRepository.update(id, data);
  } catch (error) {
    console.error('Error updating supplier:', error);
    throw error;
  }
});

ipcMain.handle('suppliers:delete', (_event, id: number) => {
  try {
    return suppliersRepository.delete(id);
  } catch (error) {
    console.error('Error deleting supplier:', error);
    throw error;
  }
});

// ==================== REPORTS ====================
ipcMain.handle('reports:getSalesReport', (_event, startDate: string, endDate: string) => {
  try {
    return reportsRepository.getSalesReport(startDate, endDate);
  } catch (error) {
    console.error('Error getting sales report:', error);
    throw error;
  }
});

ipcMain.handle('reports:getSalesForExport', (_event, startDate: string, endDate: string) => {
  try {
    return reportsRepository.getSalesForExport(startDate, endDate);
  } catch (error) {
    console.error('Error getting sales for export:', error);
    throw error;
  }
});

ipcMain.handle('reports:getExpensesReport', (_event, startDate: string, endDate: string) => {
  try {
    return expensesRepository.getSummary(startDate, endDate);
  } catch (error) {
    console.error('Error getting expenses report:', error);
    throw error;
  }
});

ipcMain.handle('dashboard:getStats', () => {
  try {
    return dashboardRepository.getStats();
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    throw error;
  }
});

// ==================== SETTINGS ====================
ipcMain.handle('settings:getAll', () => {
  try {
    return settingsRepository.getAll();
  } catch (error) {
    console.error('Error getting settings:', error);
    throw error;
  }
});

ipcMain.handle('settings:saveAll', (_event, settings) => {
  try {
    return settingsRepository.saveAll(settings);
  } catch (error) {
    console.error('Error saving settings:', error);
    throw error;
  }
});

ipcMain.handle('settings:get', (_event, key: string) => {
  try {
    return settingsRepository.get(key);
  } catch (error) {
    console.error('Error getting setting:', error);
    throw error;
  }
});

ipcMain.handle('settings:set', (_event, key: string, value: string) => {
  try {
    return settingsRepository.set(key, value);
  } catch (error) {
    console.error('Error setting value:', error);
    throw error;
  }
});
ipcMain.handle('reports:exportExcel', async (_, startDate: string, endDate: string) => {
  const sales = reportsRepository.getSalesForExport(startDate, endDate);
  const filePath = await generateSalesExcel(sales, startDate, endDate);
  return filePath;
});

// Image handlers
ipcMain.handle('images:select', async () => {
  return await selectProductImage();
});

ipcMain.handle('images:save', async (_, sourcePath: string) => {
  return saveProductImage(sourcePath);
});

ipcMain.handle('images:delete', async (_, imagePath: string) => {
  return deleteProductImage(imagePath);
});

ipcMain.handle('images:getBase64', async (_, imagePath: string) => {
  return getImageAsBase64(imagePath);
});
console.log('✅ IPC handlers registrados (completo)');
}
