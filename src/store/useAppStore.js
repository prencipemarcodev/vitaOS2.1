import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * useAppStore — configurazione globale utente, tema, mese selezionato.
 */
export const useAppStore = create(
  persist(
    (set, get) => ({
      // Theme
      theme: 'light',
      setTheme: (theme) => {
        document.documentElement.dataset.theme = theme
        set({ theme })
      },
      toggleTheme: () => {
        const next = get().theme === 'light' ? 'dark' : 'light'
        document.documentElement.dataset.theme = next
        set({ theme: next })
      },

      // Month selector (shared across panels that use month)
      selectedMonth: new Date().toISOString(),
      setSelectedMonth: (iso) => set({ selectedMonth: iso }),

      // Onboarding
      onboardingCompleted: false,
      setOnboardingCompleted: (v) => set({ onboardingCompleted: v }),
      showOnboardingForce: false,
      setShowOnboardingForce: (v) => set({ showOnboardingForce: v }),

      // User config (mirror from Supabase user_config row)
      userConfig: null,
      setUserConfig: (config) => set({ userConfig: config }),

      // Global modal state (for keyboard shortcuts)
      openModal: null,
      setOpenModal: (modal) => set({ openModal: modal }),
      closeModal: () => set({ openModal: null }),
    }),
    {
      name: 'vitaos-app',
      partialize: (s) => ({ theme: s.theme, selectedMonth: s.selectedMonth, onboardingCompleted: s.onboardingCompleted }),
    }
  )
)
