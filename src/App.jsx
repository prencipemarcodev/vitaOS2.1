import { useEffect } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'
import { useAppStore } from '@/store/useAppStore'
import Sidebar from '@/components/layout/Sidebar'
import BottomNav from '@/components/layout/BottomNav'
import AppRouter from '@/router'

function App() {
  const { theme, onboardingCompleted } = useAppStore()

  // Sync theme on mount
  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  // TODO: se !onboardingCompleted → mostrare Onboarding wizard (Fase 5)

  return (
    <BrowserRouter>
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
