import { create } from 'zustand'

export const useCalendarStore = create((set, get) => ({
  events: [],
  absences: [],
  recurringEvents: [],
  subscriptions: [],
  loading: false,

  setEvents: (events) => set({ events }),
  setAbsences: (absences) => set({ absences }),
  setRecurringEvents: (recurring) => set({ recurringEvents: recurring }),
  setSubscriptions: (subscriptions) => set({ subscriptions }),

  addEvent: (event) => set((s) => ({ events: [...s.events, event] })),
  updateEvent: (id, updates) => set((s) => ({
    events: s.events.map((e) => e.id === id ? { ...e, ...updates } : e),
  })),
  removeEvent: (id) => set((s) => ({ events: s.events.filter((e) => e.id !== id) })),

  addAbsence: (absence) => set((s) => ({ absences: [...s.absences, absence] })),
  removeAbsence: (id) => set((s) => ({ absences: s.absences.filter((a) => a.id !== id) })),

  setLoading: (loading) => set({ loading }),
}))

