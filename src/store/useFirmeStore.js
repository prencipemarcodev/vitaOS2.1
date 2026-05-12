import { create } from 'zustand'

export const useFirmeStore = create((set) => ({
  sessions: [],
  loading: false,

  setSessions: (sessions) => set({ sessions }),
  addSession: (session) => set((s) => ({ sessions: [session, ...s.sessions] })),
  updateSession: (id, updates) => set((s) => ({
    sessions: s.sessions.map((sess) => sess.id === id ? { ...sess, ...updates } : sess),
  })),
  removeSession: (id) => set((s) => ({
    sessions: s.sessions.filter((sess) => sess.id !== id),
  })),
  setLoading: (loading) => set({ loading }),
}))
