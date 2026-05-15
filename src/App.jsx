import { useEffect } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'
import { useAppStore } from '@/store/useAppStore'
import { useSupabaseSync } from '@/hooks/useSupabaseSync'
import Sidebar from '@/components/layout/Sidebar'
import FloatingPillNav, { PILL_HEIGHT } from '@/components/layout/FloatingPillNav'
import AppRouter from '@/router'
import Onboarding from '@/pages/Onboarding'


import { useLocation } from 'react-router-dom'
import AuthPage from '@/pages/AuthPage'
import AdminLogin from '@/pages/Admin/AdminLogin'
import { useAuthStore } from '@/store/useAuthStore'
import { supabase } from '@/lib/supabase'

function AppInner() {
  const { theme, onboardingCompleted, userConfig } = useAppStore()
  const { session, setSession, loading: authLoading } = useAuthStore()
  const location = useLocation()

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

  // Se l'autenticazione sta caricando o la sessione è in fase di recupero
  if (authLoading) {
    return (
      <div className="flex h-[100dvh] w-full items-center justify-center bg-[var(--bg-base)]">
        <div className="flex flex-col items-center gap-3">
          <span className="text-2xl font-semibold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
            vita<span style={{ color: 'var(--color-primary)' }}>OS</span>
          </span>
          <div className="w-5 h-5 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  // 4. Gestione Rotte Admin (Isolate dal resto dell'app)
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
          <span className="text-2xl font-semibold text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
            vita<span style={{ color: 'var(--color-primary)' }}>OS</span>
          </span>
          <div className="w-5 h-5 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  // 6. Se onboarding non completato → mostra wizard fullscreen
  if (!onboardingCompleted) {
    return <Onboarding />
  }

  return (
    <div className="h-[100dvh] w-full flex overflow-hidden bg-[var(--bg-base)]">
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
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppInner />

      {/* Toast notifications */}
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            bottom: `calc(${PILL_HEIGHT}px + 16px)`,
            background: 'var(--bg-surface)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.875rem',
          },
        }}
      />
    </BrowserRouter>
  )
}

export default App
