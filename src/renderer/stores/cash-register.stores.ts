// src/stores/cash-register.store.ts
import { create } from 'zustand';
import type { CashRegister, CashMovement, ClosingSummary } from '../../shared/types/electron';

interface CashRegisterState {
  currentRegister: CashRegister | null;
  movements: CashMovement[];
  summary: ClosingSummary | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadCurrentRegister: () => Promise<void>;
  openRegister: (openingAmount: number) => Promise<boolean>;
  closeRegister: (closingAmount: number, notes?: string) => Promise<boolean>;
  loadMovements: () => Promise<void>;
  loadSummary: () => Promise<void>;
  addMovement: (type: 'income' | 'expense', amount: number, concept: string, description?: string) => Promise<boolean>;
  deleteMovement: (id: number) => Promise<boolean>;
  clearError: () => void;
}

export const useCashRegisterStore = create<CashRegisterState>((set, get) => ({
  currentRegister: null,
  movements: [],
  summary: null,
  isLoading: false,
  error: null,

  loadCurrentRegister: async () => {
    set({ isLoading: true, error: null });
    try {
      const register = await window.electronAPI.cash.getOpen();
      set({ currentRegister: register, isLoading: false });
      
      if (register) {
        // Cargar movimientos y resumen si hay caja abierta
        get().loadMovements();
        get().loadSummary();
      }
    } catch (error) {
      set({ error: 'Error al cargar la caja', isLoading: false });
      console.error('Error loading register:', error);
    }
  },

  openRegister: async (openingAmount: number) => {
    set({ isLoading: true, error: null });
    try {
      const register = await window.electronAPI.cash.open(openingAmount);
      set({ currentRegister: register, movements: [], summary: null, isLoading: false });
      return true;
    } catch (error: any) {
      set({ error: error.message || 'Error al abrir la caja', isLoading: false });
      console.error('Error opening register:', error);
      return false;
    }
  },

  closeRegister: async (closingAmount: number, notes?: string) => {
    const { currentRegister } = get();
    if (!currentRegister) return false;

    set({ isLoading: true, error: null });
    try {
      await window.electronAPI.cash.close(currentRegister.id, closingAmount, notes);
      set({ currentRegister: null, movements: [], summary: null, isLoading: false });
      return true;
    } catch (error: any) {
      set({ error: error.message || 'Error al cerrar la caja', isLoading: false });
      console.error('Error closing register:', error);
      return false;
    }
  },

  loadMovements: async () => {
    const { currentRegister } = get();
    if (!currentRegister) return;

    try {
      const movements = await window.electronAPI.cash.getMovements(currentRegister.id);
      set({ movements });
    } catch (error) {
      console.error('Error loading movements:', error);
    }
  },

  loadSummary: async () => {
    const { currentRegister } = get();
    if (!currentRegister) return;

    try {
      const summary = await window.electronAPI.cash.getClosingSummary(currentRegister.id);
      set({ summary });
    } catch (error) {
      console.error('Error loading summary:', error);
    }
  },

  addMovement: async (type, amount, concept, description) => {
    const { currentRegister } = get();
    if (!currentRegister) return false;

    set({ isLoading: true, error: null });
    try {
      await window.electronAPI.cash.addMovement({
        cashRegisterId: currentRegister.id,
        type,
        amount,
        concept,
        description,
      });
      
      // Recargar movimientos y resumen
      await get().loadMovements();
      await get().loadSummary();
      
      set({ isLoading: false });
      return true;
    } catch (error: any) {
      set({ error: error.message || 'Error al agregar movimiento', isLoading: false });
      console.error('Error adding movement:', error);
      return false;
    }
  },

  deleteMovement: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const success = await window.electronAPI.cash.deleteMovement(id);
      
      if (success) {
        await get().loadMovements();
        await get().loadSummary();
      }
      
      set({ isLoading: false });
      return success;
    } catch (error: any) {
      set({ error: error.message || 'Error al eliminar movimiento', isLoading: false });
      console.error('Error deleting movement:', error);
      return false;
    }
  },

  clearError: () => set({ error: null }),
}));