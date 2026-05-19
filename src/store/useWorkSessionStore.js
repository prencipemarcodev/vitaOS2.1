import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * useWorkSessionStore — stato globale del timer di lavoro.
 * Condiviso tra Overview (quick action), Sidebar (badge), Firme (WorkTimer).
 */
export const useWorkSessionStore = create(
  persist(
    (set, get) => ({
      isRunning: false,
      isPaused: false,
      checkIn: null,       // 'HH:mm'
      checkInDate: null,   // 'yyyy-MM-dd'
      elapsed: 0,          // secondi
      pauseElapsed: 0,     // secondi in pausa
      
      // Pomodoro Timer state
      mode: 'standard',    // 'standard' | 'pomodoro'
      pomoPhase: 'work',   // 'work' | 'break'
      pomoSecondsLeft: 25 * 60,
      completedPomodoros: 0,

      startSession: (checkIn, checkInDate) => set({
        isRunning: true,
        isPaused: false,
        checkIn,
        checkInDate,
        elapsed: 0,
        pauseElapsed: 0,
        mode: get().mode || 'standard',
        pomoPhase: 'work',
        pomoSecondsLeft: 25 * 60,
        completedPomodoros: 0,
      }),

      pauseSession: () => set({ isPaused: true }),
      resumeSession: () => set({ isPaused: false }),

      tickElapsed: () => set(s => ({ elapsed: s.elapsed + 1 })),
      tickPause: () => set(s => ({ pauseElapsed: s.pauseElapsed + 1 })),
      
      setMode: (mode) => set({ mode }),
      setPomoPhase: (pomoPhase) => set({ pomoPhase }),
      setPomoSecondsLeft: (pomoSecondsLeft) => set({ pomoSecondsLeft }),
      setCompletedPomodoros: (completedPomodoros) => set({ completedPomodoros }),
      
      tickPomo: () => set(s => {
        if (s.pomoSecondsLeft <= 1) {
          const nextPhase = s.pomoPhase === 'work' ? 'break' : 'work'
          const nextSeconds = nextPhase === 'work' ? 25 * 60 : 5 * 60
          const addedPomo = s.pomoPhase === 'work' ? 1 : 0
          return {
            pomoPhase: nextPhase,
            pomoSecondsLeft: nextSeconds,
            completedPomodoros: s.completedPomodoros + addedPomo,
          }
        }
        return { pomoSecondsLeft: s.pomoSecondsLeft - 1 }
      }),

      stopSession: () => set({
        isRunning: false,
        isPaused: false,
        checkIn: null,
        checkInDate: null,
        elapsed: 0,
        pauseElapsed: 0,
        pomoPhase: 'work',
        pomoSecondsLeft: 25 * 60,
        completedPomodoros: 0,
      }),
    }),
    {
      name: 'vitaos-work-session',
    }
  )
)

