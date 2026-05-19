import { create } from 'zustand'

export const useTaskStore = create((set) => ({
  tasks: [],
  loading: false,

  setTasks: (tasks) => set({ tasks }),
  addTask: (task) => set((s) => ({ tasks: [task, ...s.tasks] })),
  updateTask: (id, updates) => set((s) => ({
    tasks: s.tasks.map((t) => t.id === id ? { ...t, ...updates } : t)
  })),
  removeTask: (id) => set((s) => ({
    tasks: s.tasks.filter((t) => t.id !== id)
  })),
  setLoading: (loading) => set({ loading }),
}))
