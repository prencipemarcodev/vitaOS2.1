import { useEffect } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'
import { useAppStore } from '@/store/useAppStore'
import { useSupabaseSync } from '@/hooks/useSupabaseSync'
import Sidebar from '@/components/layout/Sidebar'
import FloatingPillNav, { PILL_HEIGHT } from '@/components/layout/FloatingPillNav'
import AppRouter from '@/router'
import Onboarding from '@/pages/Onboarding'
import { createPortal } from 'react-dom'

function DebugOverlay() {
  return createPortal(
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-visible">
      {/* Viewport Bounds (Blue) */}
      <div className="absolute inset-0 border-[4px] border-blue-500 flex flex-col justify-between p-2">
        <span className="text-blue-500 font-bold bg-black/50 w-fit text-xs px-1">VIEWPORT (fixed inset-0)</span>
      </div>

      {/* Safe Area Bottom (Red) */}
      <div 
        className="absolute bottom-0 w-full bg-red-500/50 flex flex-col items-center justify-start border-t-2 border-red-500"
        style={{ height: 'max(env(safe-area-inset-bottom, 0px), 34px)' }}
      >
        <span className="text-white font-bold text-[10px] bg-black/80 px-1 mt-1">SAFE AREA BOTTOM (or 34px)</span>
      </div>

      {/* 100dvh indicator (Purple) */}
      <div className="absolute top-0 left-0 w-4 h-[100dvh] bg-purple-500/50 border-r-2 border-purple-500 flex items-end">
        <span className="text-white text-[10px] -rotate-90 origin-bottom-left mb-16 ml-1 whitespace-nowrap bg-black/80 px-1">100dvh</span>
      </div>

      {/* 100svh indicator (Cyan) */}
      <div className="absolute top-0 left-4 w-4 h-[100svh] bg-cyan-500/50 border-r-2 border-cyan-500 flex items-end">
        <span className="text-white text-[10px] -rotate-90 origin-bottom-left mb-16 ml-1 whitespace-nowrap bg-black/80 px-1">100svh</span>
      </div>

      {/* 100vh indicator (Yellow) */}
      <div className="absolute top-0 right-0 w-4 h-[100vh] bg-yellow-500/50 border-l-2 border-yellow-500 flex items-end">
        <span className="text-white text-[10px] -rotate-90 origin-bottom-left mb-16 ml-1 whitespace-nowrap bg-black/80 px-1">100vh</span>
      </div>
      
      {/* Absolute bottom 0 marker */}
      <div className="absolute bottom-0 left-10 right-10 h-1 bg-white" />
      <span className="absolute bottom-1 left-10 text-white text-[10px] bg-black/80 px-1">Absolute bottom: 0</span>
    </div>,
    document.body
  )
}

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
    <div className="h-[100dvh] flex overflow-hidden bg-[var(--bg-base)] relative border-[4px] border-green-500">
      <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/80 text-green-500 font-bold px-2 py-1 z-[9999] pointer-events-none text-xs">
        AppInner Container (Green Border)
      </span>
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
      <DebugOverlay />
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
