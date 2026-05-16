import { create } from 'zustand'

export const useHealthStore = create((set) => ({
  workoutSessions: [],
  weightLog: [],
  gymSchedules: [],
  sleepLog: [],
  waterLog: [],
  loading: false,

  setWorkoutSessions: (sessions) => set({ workoutSessions: sessions }),
  addWorkoutSession: (session) => set((s) => ({ workoutSessions: [session, ...s.workoutSessions] })),
  removeWorkoutSession: (id) => set((s) => ({
    workoutSessions: s.workoutSessions.filter((w) => w.id !== id),
  })),

  setWeightLog: (log) => set({ weightLog: log }),
  addWeightEntry: (entry) => set((s) => ({ weightLog: [entry, ...s.weightLog] })),

  setGymSchedules: (schedules) => set({ gymSchedules: schedules }),
  addGymSchedule: (schedule) => set((s) => ({ gymSchedules: [...s.gymSchedules, schedule] })),
  removeGymSchedule: (id) => set((s) => ({
    gymSchedules: s.gymSchedules.filter((g) => g.id !== id),
  })),

  // Sleep log
  setSleepLog: (log) => set({ sleepLog: log }),
  addSleepEntry: (entry) => set((s) => ({ sleepLog: [entry, ...s.sleepLog] })),
  updateSleepEntry: (id, updates) => set((s) => ({
    sleepLog: s.sleepLog.map((e) => e.id === id ? { ...e, ...updates } : e),
  })),

  // Water log
  setWaterLog: (log) => set({ waterLog: log }),
  addWaterEntry: (entry) => set((s) => ({ waterLog: [entry, ...s.waterLog] })),
  updateWaterEntry: (id, updates) => set((s) => ({
    waterLog: s.waterLog.map((e) => e.id === id ? { ...e, ...updates } : e),
  })),

  setLoading: (loading) => set({ loading }),
}))

