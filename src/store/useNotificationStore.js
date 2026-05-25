import { create } from 'zustand'

export const useNotificationStore = create((set) => ({
  notifications: [],

  addNotification: (notif) => set((state) => ({
    notifications: [
      {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        read: false,
        ...notif
      },
      ...state.notifications
    ]
  })),

  markAsRead: (id) => set((state) => ({
    notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n)
  })),

  markAllAsRead: () => set((state) => ({
    notifications: state.notifications.map(n => ({ ...n, read: true }))
  })),

  dismiss: (id) => set((state) => ({
    notifications: state.notifications.filter(n => n.id !== id)
  })),
}))
