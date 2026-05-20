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
      reminderTimes: ['09:00'],

      setSetting: (key, val) => set((state) => ({ [key]: val })),
      addTriggered: (key) => set((state) => ({
        triggeredToday: { ...state.triggeredToday, [key]: true }
      })),
      resetTriggered: () => set({ triggeredToday: {} }),
      
      addReminderTime: (time) => set((state) => ({
        reminderTimes: [...(state.reminderTimes || []), time]
      })),
      removeReminderTime: (index) => set((state) => ({
        reminderTimes: (state.reminderTimes || []).filter((_, i) => i !== index)
      })),
      updateReminderTime: (index, time) => set((state) => ({
        reminderTimes: (state.reminderTimes || []).map((t, i) => i === index ? time : t)
      }))
    }),
    {
      name: 'vitaos-reminders',
      partialize: (s) => ({
        enabled: s.enabled,
        sleepReminder: s.sleepReminder,
        waterReminder: s.waterReminder,
        calendarReminder: s.calendarReminder,
        soundEnabled: s.soundEnabled,
        triggeredToday: s.triggeredToday,
        reminderTimes: s.reminderTimes || ['09:00']
      })
    }
  )
)
