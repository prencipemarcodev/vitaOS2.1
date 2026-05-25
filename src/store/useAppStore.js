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
      // Supporta sia oggetto diretto che updater funzionale
      setUserConfig: (configOrFn) => set(state => {
        const nextConfig = typeof configOrFn === 'function' ? configOrFn(state.userConfig) : configOrFn
        if (nextConfig) {
          // Carica i valori dal localStorage come fallback se non presenti nel db
          const gps_preset = nextConfig.gps_preset || localStorage.getItem('vitaos_gps_gps_preset') || 'balanced'
          const gps_jitter_meters = nextConfig.gps_jitter_meters ?? (localStorage.getItem('vitaos_gps_gps_jitter_meters') ? parseInt(localStorage.getItem('vitaos_gps_gps_jitter_meters')) : 6)
          const gps_keepalive = nextConfig.gps_keepalive ?? (localStorage.getItem('vitaos_gps_gps_keepalive') === 'true')
          const gps_keepalive_interval_ms = nextConfig.gps_keepalive_interval_ms ?? (localStorage.getItem('vitaos_gps_gps_keepalive_interval_ms') ? parseInt(localStorage.getItem('vitaos_gps_gps_keepalive_interval_ms')) : 2000)

          let custom_accounts = nextConfig.custom_accounts
          if (custom_accounts === undefined || custom_accounts === null) {
            const localAcc = localStorage.getItem('vitaos_custom_accounts')
            if (localAcc) {
              try {
                custom_accounts = JSON.parse(localAcc)
              } catch (e) {
                console.error("Errore nel parsing locale dei conti:", e)
              }
            }
          }

          // Salva in localStorage se presenti esplicitamente
          if ('gps_preset' in nextConfig && nextConfig.gps_preset !== undefined) {
            localStorage.setItem('vitaos_gps_gps_preset', nextConfig.gps_preset)
          }
          if ('gps_jitter_meters' in nextConfig && nextConfig.gps_jitter_meters !== undefined) {
            localStorage.setItem('vitaos_gps_gps_jitter_meters', nextConfig.gps_jitter_meters.toString())
          }
          if ('gps_keepalive' in nextConfig && nextConfig.gps_keepalive !== undefined) {
            localStorage.setItem('vitaos_gps_gps_keepalive', nextConfig.gps_keepalive.toString())
          }
          if ('gps_keepalive_interval_ms' in nextConfig && nextConfig.gps_keepalive_interval_ms !== undefined) {
            localStorage.setItem('vitaos_gps_gps_keepalive_interval_ms', nextConfig.gps_keepalive_interval_ms.toString())
          }
          if ('custom_accounts' in nextConfig && nextConfig.custom_accounts !== undefined && nextConfig.custom_accounts !== null) {
            localStorage.setItem('vitaos_custom_accounts', JSON.stringify(nextConfig.custom_accounts))
          }

          return {
            userConfig: {
              ...nextConfig,
              gps_preset,
              gps_jitter_meters,
              gps_keepalive,
              gps_keepalive_interval_ms,
              custom_accounts
            }
          }
        }
        return { userConfig: nextConfig }
      }),

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
