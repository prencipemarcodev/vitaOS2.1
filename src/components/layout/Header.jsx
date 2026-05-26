import { useState } from 'react'
import NotificationBell from '@/components/ui/NotificationBell'
import NotificationDrawer from '@/components/ui/NotificationDrawer'
import MonthSelector from './MonthSelector'
import clsx from 'clsx'

/**
 * Header 2.1 — Ridisegnato da zero per robustezza massima.
 * Supporta: Safe Area iOS, Tematizzazione Dark/Light, Blur, Allineamento Perfetto.
 */
function Header({ title, showMonth = false, showNotification = false, actions, className }) {
  const [notifOpen, setNotifOpen] = useState(false)

  return (
    <>
      <header
        className={clsx(
          'sticky top-0 z-[100] shrink-0 transition-all duration-[var(--transition-fast)]',
          // Mobile base layout
          'pt-[env(safe-area-inset-top,0px)] bg-[var(--bg-surface)]/80 backdrop-blur-md border-b border-[var(--border-subtle)]',
          // Desktop floating pill overrides
          'lg:mx-4 lg:mt-4 lg:mb-2 lg:rounded-full lg:bg-[var(--bg-surface)] lg:border lg:border-[var(--border-subtle)] lg:shadow-[0_8px_30px_rgba(0,0,0,0.03)] lg:pt-0 lg:backdrop-blur-none',
          className
        )}
      >
        <div className="h-[var(--header-height)] px-4 lg:px-6 flex items-center justify-between relative max-w-full">
          {/* Sinistra: Titolo */}
          <div className="flex-[1] min-w-0 flex items-center pr-2">
            <h1
              className="text-sm font-bold text-[var(--text-primary)] leading-none truncate tracking-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {title}
            </h1>
          </div>

          {/* Centro: Selettore Mese (Assoluto per centraggio perfetto) */}
          {showMonth && (
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
              <div className="scale-90 sm:scale-100">
                <MonthSelector />
              </div>
            </div>
          )}

          {/* Destra: Azioni e Notifiche */}
          <div className="flex-[1] flex items-center justify-end gap-1.5 pl-2">
            {actions && (
              <div className="flex items-center">
                {actions}
              </div>
            )}
            {showNotification && (
              <NotificationBell onClick={() => setNotifOpen(true)} />
            )}
          </div>
        </div>
      </header>

      {/* Drawer delle notifiche */}
      {showNotification && (
        <NotificationDrawer isOpen={notifOpen} onClose={() => setNotifOpen(false)} />
      )}
    </>
  )
}

export default Header
