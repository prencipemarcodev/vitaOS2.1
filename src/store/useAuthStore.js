import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

export const useAuthStore = create((set) => ({
  session: null,
  user: null,
  loading: true,

  setSession: (session) => set({ 
    session, 
    user: session?.user ?? null, 
    loading: false 
  }),

  signOut: async () => {
    await supabase.auth.signOut()
    set({ session: null, user: null, loading: false })

    // ── Svuota tutti gli store per evitare data leak tra utenti ──
    // Importazione lazy per evitare circular deps
    const { useCalendarStore } = await import('@/store/useCalendarStore')
    const { useFinanceStore } = await import('@/store/useFinanceStore')
    const { useFirmeStore } = await import('@/store/useFirmeStore')
    const { useHealthStore } = await import('@/store/useHealthStore')
    const { useNoteStore } = await import('@/store/useNoteStore')
    const { useSavingsStore } = await import('@/store/useSavingsStore')
    const { useAppStore } = await import('@/store/useAppStore')

    useCalendarStore.getState().setEvents([])
    useCalendarStore.getState().setAbsences([])
    useCalendarStore.getState().setRecurringEvents([])
    useFinanceStore.getState().setTransactions([])
    useFinanceStore.getState().setCategories([])
    useFirmeStore.getState().setSessions([])
    useHealthStore.getState().setWorkoutSessions([])
    useHealthStore.getState().setWeightLog([])
    useHealthStore.getState().setGymSchedules([])
    useHealthStore.getState().setSleepLog([])
    useHealthStore.getState().setWaterLog([])
    useNoteStore.getState().setNotes([])
    useSavingsStore.getState().setPlans([])
    useSavingsStore.getState().setMovements([])
    useAppStore.getState().setUserConfig(null)
  }
}))
