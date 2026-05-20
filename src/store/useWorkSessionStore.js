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
      startTime: null,     // timestamp
      pauseStartTime: null, // timestamp
      accumulatedPauseElapsed: 0, // secondi accumulati in pausa prima del ciclo corrente
      
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
        startTime: Date.now(),
        pauseStartTime: null,
        accumulatedPauseElapsed: 0,
        mode: get().mode || 'standard',
        pomoPhase: 'work',
        pomoSecondsLeft: 25 * 60,
        completedPomodoros: 0,
      }),

      pauseSession: () => set({
        isPaused: true,
        pauseStartTime: Date.now(),
        accumulatedPauseElapsed: get().pauseElapsed
      }),

      resumeSession: () => set({
        isPaused: false,
        pauseStartTime: null,
        accumulatedPauseElapsed: get().pauseElapsed
      }),

      tickElapsed: () => {
        const state = get()
        if (state.isPaused) return
        const now = Date.now()
        const start = state.startTime || now
        const calculatedElapsed = Math.floor((now - start) / 1000) - state.pauseElapsed
        set({
          elapsed: Math.max(0, calculatedElapsed)
        })
      },

      tickPause: () => {
        const state = get()
        if (!state.isPaused || !state.pauseStartTime) return
        const now = Date.now()
        const diff = Math.floor((now - state.pauseStartTime) / 1000)
        set({
          pauseElapsed: state.accumulatedPauseElapsed + diff
        })
      },
      
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
        startTime: null,
        pauseStartTime: null,
        accumulatedPauseElapsed: 0,
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

