import { create } from 'zustand'

export const useSavingsStore = create((set) => ({
  plans: [],
  movements: [],
  loading: false,

  setPlans: (plans) => set({ plans }),
  addPlan: (plan) => set((s) => ({ plans: [...s.plans, plan] })),
  updatePlan: (id, updates) => set((s) => ({
    plans: s.plans.map((p) => p.id === id ? { ...p, ...updates } : p),
  })),
  removePlan: (id) => set((s) => ({ plans: s.plans.filter((p) => p.id !== id) })),

  setMovements: (movements) => set({ movements }),
  addMovement: (movement) => set((s) => ({ movements: [movement, ...s.movements] })),

  setLoading: (loading) => set({ loading }),
}))
