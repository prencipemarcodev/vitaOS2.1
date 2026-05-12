import { create } from 'zustand'

export const useHealthStore = create((set) => ({
  workoutSessions: [],
  weightLog: [],
  gymSchedules: [],
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

  setLoading: (loading) => set({ loading }),
}))
