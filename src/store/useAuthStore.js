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
  }
}))
