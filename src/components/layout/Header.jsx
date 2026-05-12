import { useState } from 'react'
import NotificationBell from '@/components/ui/NotificationBell'
import NotificationDrawer from '@/components/ui/NotificationDrawer'
import MonthSelector from './MonthSelector'
import clsx from 'clsx'

/**
 * Header — layout riorganizzato per garantire la centratura del mese: [Titolo] [Mese Anno ◀ ▶] [Azioni]
 */
function Header({ title, showMonth = false, showNotification = false, actions, className }) {
  const [notifOpen, setNotifOpen] = useState(false)

  return (
    <>
      <header
        className={clsx(
          'relative flex items-center justify-between px-4 lg:px-5 shrink-0 z-20',
          'bg-white border-b border-[var(--border-subtle)] shadow-sm',
          className
        )}
        style={{ height: 'var(--header-height)', minHeight: 'var(--header-height)' }}
      >
        {/* Left: Title */}
        <div className="flex items-center min-w-0 pr-2">
          <h1
            className="text-sm font-bold text-[var(--text-primary)] leading-none truncate"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {title}
          </h1>
        </div>

        {/* Center: Month Selector (Absolute centered) */}
        {showMonth && (
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center whitespace-nowrap z-10 pointer-events-none">
            <div className="pointer-events-auto scale-[0.85] sm:scale-100">
              <MonthSelector />
            </div>
          </div>
        )}

        {/* Right: Actions + Notification */}
        <div className="flex items-center gap-2 pl-2 shrink-0">
          <div className="flex items-center gap-2 max-sm:scale-90 origin-right">
            {actions}
          </div>
          {showNotification && (
            <NotificationBell onClick={() => setNotifOpen(true)} />
          )}
        </div>
      </header>

      {/* Notification drawer */}
      {showNotification && (
        <NotificationDrawer isOpen={notifOpen} onClose={() => setNotifOpen(false)} />
      )}
    </>
  )
}

export default Header
