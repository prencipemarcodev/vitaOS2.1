import { useEffect, useState } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'
import { useAppStore } from '@/store/useAppStore'
import { useNotificationStore } from '@/store/useNotificationStore'
import { useSupabaseSync } from '@/hooks/useSupabaseSync'
import Sidebar from '@/components/layout/Sidebar'
import FloatingPillNav, { PILL_HEIGHT } from '@/components/layout/FloatingPillNav'
import AppRouter from '@/router'
import Onboarding from '@/pages/Onboarding'
import Logo from '@/components/layout/Logo'
import { ReminderEngine } from '@/components/layout/ReminderEngine'
import { AnimatePresence } from 'framer-motion'
import FloatingTimer from '@/components/layout/FloatingTimer'
import WorkTimer from '@/pages/Firme/WorkTimer'
import { useWorkSessionStore } from '@/store/useWorkSessionStore'
import ConfirmationModal from '@/components/ui/ConfirmationModal'

import { useLocation } from 'react-router-dom'
import AuthPage from '@/pages/AuthPage'
import AdminLogin from '@/pages/Admin/AdminLogin'
import { useAuthStore } from '@/store/useAuthStore'
import { supabase } from '@/lib/supabase'

import { toast } from 'sonner'
import { Sparkles } from 'lucide-react'

function OnboardingReminder() {
  const { userConfig, setShowOnboardingForce } = useAppStore()
  const { notifications, addNotification } = useNotificationStore()
  
  useEffect(() => {
    // Se l'onboarding è "finito" ma gli step non sono completi (step < 6)
    if (userConfig?.onboarding_completed && (userConfig?.onboarding_step || 0) < 6) {
      
      // 1. Mostra il toast (veloce)
      toast('Completa la configurazione', {
        description: 'Personalizza i tuoi orari e il tuo reddito per ottenere il massimo da VitaOS.',
        icon: <Sparkles className="text-[var(--color-primary)]" size={18} />,
        duration: 10000,
        action: {
          label: 'Inizia',
          onClick: () => setShowOnboardingForce(true)
        }
      })

      // 2. Aggiungi al centro notifiche se non già presente
      const hasOnboardingNotif = notifications.some(n => n.id === 'onboarding-reminder')
      if (!hasOnboardingNotif) {
        addNotification({
          id: 'onboarding-reminder',
          type: 'info',
          message: 'Configurazione incompleta: clicca qui per personalizzare i tuoi orari e il reddito.',
          icon: 'sparkles',
          category: 'Sistema',
          action: () => setShowOnboardingForce(true)
        })
      }
    }
  }, [userConfig?.onboarding_completed, userConfig?.onboarding_step, setShowOnboardingForce])

  return null
}

function AppInner() {
  const { theme, onboardingCompleted, userConfig, showOnboardingForce } = useAppStore()
  const { session, setSession, loading: authLoading } = useAuthStore()
  const location = useLocation()
  const isFullTimerOpen = useWorkSessionStore(state => state.isFullTimerOpen)

  // 1. Listen for Auth Changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [setSession])

  // 2. Sync theme on mount
  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  // 3. Load all data from Supabase into Zustand stores
  useSupabaseSync()

  // Safety timeout: se userConfig rimane null per più di 8s (PWA stale cache),
  // forza un ricaricamento della pagina
  useEffect(() => {
    if (!session) return
    const t = setTimeout(() => {
      if (!useAppStore.getState().userConfig) {
        console.warn('[VitaOS] userConfig timeout — forcing reload')
        window.location.reload()
      }
    }, 8000)
    return () => clearTimeout(t)
  }, [session])

  // 4. Global Work Session Timer Ticking (keeps ticking synchronized cross-page)
  const { isRunning, tickElapsed, tickPause, tickLunchBreak, tickPomo } = useWorkSessionStore()

  useEffect(() => {
    if (!isRunning) return

    const interval = setInterval(() => {
      const state = useWorkSessionStore.getState()
      if (!state.isPaused) {
        state.tickElapsed()
        if (state.mode === 'pomodoro') {
          state.tickPomo()
        }
      } else if (state.isLunchBreak) {
        state.tickLunchBreak()
      } else {
        state.tickPause()
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [isRunning, tickElapsed, tickPause, tickLunchBreak, tickPomo])

  // Se l'autenticazione sta caricando o la sessione è in fase di recupero
  if (authLoading) {
    return (
      <div className="flex h-[100dvh] w-full items-center justify-center bg-[var(--bg-base)]">
        <div className="flex flex-col items-center gap-3">
          <Logo className="text-2xl" />
          <div className="w-5 h-5 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  // 4. Gestione Rotte Admin (Isolate dal resto dell'app)
  // La verifica dell'email admin avviene nell'AdminDashboard stesso.
  // Non usiamo isAdminMaster (bypassabile via console) — solo session reale.
  if (location.pathname.startsWith('/admin')) {
    if (!session) {
      return <AdminLogin />
    }
    return <AppRouter />
  }

  // 5. Se non sei loggato → Mostra pagina di Auth utente
  if (!session) {
    return <AuthPage />
  }

  // 6. Se loggato ma config non ancora caricato (in attesa di useSupabaseSync)
  if (!userConfig) {
    return (
      <div className="flex h-[100dvh] w-full items-center justify-center bg-[var(--bg-base)]">
        <div className="flex flex-col items-center gap-3">
          <Logo className="text-2xl" />
          <div className="w-5 h-5 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  // 6. Se onboarding non completato → mostra wizard fullscreen
  if (!onboardingCompleted || useAppStore.getState().showOnboardingForce) {
    return <Onboarding />
  }

  return (
    <div className="h-[100dvh] w-full flex overflow-hidden bg-[var(--bg-base)]">
      <OnboardingReminder />
      <ReminderEngine />
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Area principale che ospita le pagine */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <AppRouter />
        </div>
      </div>

      {/* Mobile Bottom Nav */}
      <FloatingPillNav />

      {/* Timer Fluttuante e Bolla (Visibile se sessione attiva e non a schermo intero) */}
      <FloatingTimer />

      {/* Timer a Schermo Intero (Overlay Globale) */}
      <AnimatePresence>
        {isFullTimerOpen && (
          <WorkTimer />
        )}
      </AnimatePresence>
      <ConfirmationModal />
    </div>
  )
}

function App() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <BrowserRouter>
      <AppInner />

      {/* Toast notifications */}
      <Toaster
        position={isMobile ? 'top-center' : 'bottom-right'}
        toastOptions={{
          style: {
            top: isMobile ? 'calc(env(safe-area-inset-top, 0px) + var(--header-height) + 2px)' : 'auto',
            bottom: isMobile ? 'auto' : '0px',
            background: 'var(--bg-surface)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.813rem',
            fontWeight: '500',
            width: isMobile ? 'calc(100vw - 32px)' : '340px',
            maxWidth: isMobile ? '400px' : '340px',
            minWidth: 'unset',
            boxShadow: '0 4px 24px -4px rgba(0,0,0,0.12)',
          },
        }}
      />
    </BrowserRouter>
  )
}

export default App
