import { create } from 'zustand'

export const usePayslipStore = create((set) => ({
  payslips: [],
  loading: false,

  setPayslips: (payslips) => set({ payslips }),
  addPayslip: (payslip) => set((s) => ({ payslips: [payslip, ...s.payslips] })),
  removePayslip: (id) => set((s) => ({
    payslips: s.payslips.filter((p) => p.id !== id),
  })),
  setLoading: (loading) => set({ loading }),
}))
