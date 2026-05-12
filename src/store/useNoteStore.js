import { create } from 'zustand'

export const useNoteStore = create((set) => ({
  notes: [],
  loading: false,
  searchQuery: '',

  setNotes: (notes) => set({ notes }),
  addNote: (note) => set((s) => ({ notes: [note, ...s.notes] })),
  updateNote: (id, updates) => set((s) => ({
    notes: s.notes.map((n) => n.id === id ? { ...n, ...updates } : n),
  })),
  removeNote: (id) => set((s) => ({ notes: s.notes.filter((n) => n.id !== id) })),
  setSearchQuery: (q) => set({ searchQuery: q }),
  setLoading: (loading) => set({ loading }),
}))
