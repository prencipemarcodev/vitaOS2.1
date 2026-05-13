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
          'relative flex items-center justify-between px-4 lg:px-5 shrink-0 z-20',
          'bg-white border-b border-[var(--border-subtle)] shadow-sm',
          'pt-[env(safe-area-inset-top)]',
          className
        )}
        style={{ 
          height: 'calc(var(--header-height) + env(safe-area-inset-top))',
        }}
      >
        {/* Sinistra: Titolo Area */}
        <div className="flex-1 flex items-center min-w-0 pr-2">
          <h1
            className="text-sm font-bold text-[var(--text-primary)] leading-none truncate"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {title}
          </h1>
        </div>

        {/* Centro: Month Selector (Centratura Assoluta) */}
        {showMonth && (
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 flex items-center justify-center z-10 pointer-events-none mt-[calc(env(safe-area-inset-top)/2.5)]">
            <div className="pointer-events-auto scale-90 sm:scale-100">
              <MonthSelector />
            </div>
          </div>
        )}

        {/* Destra: Azioni Area */}
        <div className="flex-1 flex items-center justify-end gap-1.5 sm:gap-2.5 pl-2">
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
      </header>

      {/* Drawer delle notifiche */}
      {showNotification && (
        <NotificationDrawer isOpen={notifOpen} onClose={() => setNotifOpen(false)} />
      )}
    </>
  )
}

export default Header
