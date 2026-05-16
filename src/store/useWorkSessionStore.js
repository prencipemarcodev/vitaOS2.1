import { create } from 'zustand'

/**
 * useWorkSessionStore — stato globale del timer di lavoro.
 * Condiviso tra Overview (quick action), Sidebar (badge), Firme (WorkTimer).
 */
export const useWorkSessionStore = create((set, get) => ({
  isRunning: false,
  isPaused: false,
  checkIn: null,       // 'HH:mm'
  checkInDate: null,   // 'yyyy-MM-dd'
  elapsed: 0,          // secondi
  pauseElapsed: 0,     // secondi in pausa

  startSession: (checkIn, checkInDate) => set({
    isRunning: true,
    isPaused: false,
    checkIn,
    checkInDate,
    elapsed: 0,
    pauseElapsed: 0,
  }),

  pauseSession: () => set({ isPaused: true }),
  resumeSession: () => set({ isPaused: false }),

  tickElapsed: () => set(s => ({ elapsed: s.elapsed + 1 })),
  tickPause: () => set(s => ({ pauseElapsed: s.pauseElapsed + 1 })),

  stopSession: () => set({
    isRunning: false,
    isPaused: false,
    checkIn: null,
    checkInDate: null,
    elapsed: 0,
    pauseElapsed: 0,
  }),
}))
