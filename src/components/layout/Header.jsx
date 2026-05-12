import { useState } from 'react'
import NotificationBell from '@/components/ui/NotificationBell'
import NotificationDrawer from '@/components/ui/NotificationDrawer'
import MonthSelector from './MonthSelector'
import clsx from 'clsx'

/**
 * Header — Layout a tre zone garantite con supporto Safe Area per iOS.
 */
function Header({ title, showMonth = false, showNotification = false, actions, className }) {
  const [notifOpen, setNotifOpen] = useState(false)

  return (
    <>
      <header
        className={clsx(
          'relative grid grid-cols-3 items-center px-4 lg:px-5 shrink-0 z-20',
          'bg-white border-b border-[var(--border-subtle)] shadow-sm',
          'pt-[env(safe-area-inset-top)]', // Supporto Notch/Status Bar iPhone
          className
        )}
        style={{ 
          height: 'calc(var(--header-height) + env(safe-area-inset-top))',
          minHeight: 'calc(var(--header-height) + env(safe-area-inset-top))' 
        }}
      >
        {/* Sinistra: Titolo */}
        <div className="flex items-center min-w-0">
          <h1
            className="text-sm font-bold text-[var(--text-primary)] leading-none truncate"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {title}
          </h1>
        </div>

        {/* Centro: Month Selector */}
        <div className="flex justify-center shrink-0">
          {showMonth && (
            <div className="scale-90 sm:scale-100">
              <MonthSelector />
            </div>
          )}
        </div>

        {/* Destra: Azioni + Campanella */}
        <div className="flex items-center justify-end gap-2">
          {actions && (
            <div className="flex items-center gap-1.5 shrink-0">
              {actions}
            </div>
          )}
          {showNotification && (
            <div className="shrink-0">
              <NotificationBell onClick={() => setNotifOpen(true)} />
            </div>
          )}
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
