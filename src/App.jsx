import { useEffect } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'
import { useAppStore } from '@/store/useAppStore'
import { useSupabaseSync } from '@/hooks/useSupabaseSync'
import Sidebar from '@/components/layout/Sidebar'
import BottomNav from '@/components/layout/BottomNav'
import AppRouter from '@/router'
import Onboarding from '@/pages/Onboarding'

function AppInner() {
  const { theme, onboardingCompleted, userConfig } = useAppStore()

  // Sync theme on mount
  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  // Load all data from Supabase into Zustand stores
  useSupabaseSync()

  // Se il config non è ancora caricato, mostra uno spinner
  if (!userConfig) {
    return (
      <div className="flex h-full items-center justify-center bg-[var(--bg-base)]">
        <div className="flex flex-col items-center gap-3">
          <span
            className="text-2xl font-semibold text-[var(--text-primary)]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            vita<span style={{ color: 'var(--color-primary)' }}>OS</span>
          </span>
          <div className="w-5 h-5 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  // Se onboarding non completato → mostra wizard fullscreen
  if (!onboardingCompleted) {
    return <Onboarding />
  }

  return (
    <div className="flex h-full overflow-hidden bg-[var(--bg-base)]">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <AppRouter />
      </div>

      {/* Mobile Bottom Nav */}
      <BottomNav />
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
