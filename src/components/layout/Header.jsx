import { useState } from 'react'
import NotificationBell from '@/components/ui/NotificationBell'
import NotificationDrawer from '@/components/ui/NotificationDrawer'
import MonthSelector from './MonthSelector'
import clsx from 'clsx'

/**
 * Header 2.1 — Layout ultra-robusto per iOS.
 * Utilizza una struttura a due livelli: 
 * 1. Padding per la Safe Area (Notch)
 * 2. Contenitore Flex per allineamento perfetto degli elementi.
 */
function Header({ title, showMonth = false, showNotification = false, actions, className }) {
  const [notifOpen, setNotifOpen] = useState(false)

  return (
    <>
      <header
        className={clsx(
          'sticky top-0 left-0 right-0 z-[100] shrink-0',
          'bg-white border-b border-[var(--border-subtle)] shadow-sm',
          'pt-[env(safe-area-inset-top)]', // Notch
          className
        )}
      >
        <div className="h-[var(--header-height)] px-4 flex items-center justify-between relative">
          {/* Sinistra: Titolo (1/3 dello spazio) */}
          <div className="flex-1 flex items-center min-w-0">
            <h1
              className="text-sm font-bold text-[var(--text-primary)] leading-none truncate"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {title}
            </h1>
          </div>

          {/* Centro: Month Selector (Centrato assolutamente rispetto al viewport) */}
          {showMonth && (
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
              <div className="scale-90 sm:scale-100">
                <MonthSelector />
              </div>
            </div>
          )}

          {/* Destra: Azioni (1/3 dello spazio) */}
          <div className="flex-1 flex items-center justify-end gap-2">
            {actions && (
              <div className="flex items-center shrink-0">
                {actions}
              </div>
            )}
            {showNotification && (
              <div className="shrink-0">
                <NotificationBell onClick={() => setNotifOpen(true)} />
              </div>
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
