import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

export const useAuthStore = create((set) => ({
  session: null,
  user: null,
  loading: true,
  isAdminMaster: false,

  setSession: (session) => set({ 
    session, 
    user: session?.user ?? null, 
    loading: false 
  }),

  setIsAdminMaster: (val) => set({ isAdminMaster: val }),

  signOut: async () => {
    await supabase.auth.signOut()
    set({ session: null, user: null, loading: false, isAdminMaster: false })
  }
}))
