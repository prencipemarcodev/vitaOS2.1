import { create } from 'zustand'

export const useFinanceStore = create((set) => ({
  transactions: [],
  categories: [],
  cumulativeBalance: 0,
  historicalTransactions: [],
  loading: false,

  setTransactions: (transactions) => set({ transactions }),
  setCategories: (categories) => set({ categories }),
  setCumulativeBalance: (cumulativeBalance) => set({ cumulativeBalance }),
  setHistoricalTransactions: (historicalTransactions) => set({ historicalTransactions }),

  addTransaction: (tx) => set((s) => ({ transactions: [tx, ...s.transactions] })),
  updateTransaction: (id, updates) => set((s) => ({
    transactions: s.transactions.map((t) => t.id === id ? { ...t, ...updates } : t),
  })),
  removeTransaction: (id) => set((s) => ({
    transactions: s.transactions.filter((t) => t.id !== id),
  })),

  addCategory: (cat) => set((s) => ({ categories: [...s.categories, cat] })),
  removeCategory: (id) => set((s) => ({ categories: s.categories.filter((c) => c.id !== id) })),

  setLoading: (loading) => set({ loading }),
}))


