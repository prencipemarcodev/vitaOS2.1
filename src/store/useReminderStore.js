import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useReminderStore = create(
  persist(
    (set) => ({
      enabled: true,
      sleepReminder: true,
      waterReminder: true,
      calendarReminder: true,
      soundEnabled: true,
      triggeredToday: {},

      setSetting: (key, val) => set((state) => ({ [key]: val })),
      addTriggered: (key) => set((state) => ({
        triggeredToday: { ...state.triggeredToday, [key]: true }
      })),
      resetTriggered: () => set({ triggeredToday: {} })
    }),
    {
      name: 'vitaos-reminders',
      partialize: (s) => ({
        enabled: s.enabled,
        sleepReminder: s.sleepReminder,
        waterReminder: s.waterReminder,
        calendarReminder: s.calendarReminder,
        soundEnabled: s.soundEnabled,
        triggeredToday: s.triggeredToday
      })
    }
  )
)
