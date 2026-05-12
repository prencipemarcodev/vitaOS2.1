import { useState } from 'react'
import NotificationBell from '@/components/ui/NotificationBell'
import NotificationDrawer from '@/components/ui/NotificationDrawer'
import MonthSelector from './MonthSelector'
import clsx from 'clsx'

/**
 * Header — due varianti:
 * - Variante A (showMonth=true): [Titolo] [MonthSelector] [Azioni]
 * - Variante B (showMonth=false): [Titolo + notifica] [Azioni]
 */
function Header({ title, showMonth = false, showNotification = false, actions, className }) {
  const [notifOpen, setNotifOpen] = useState(false)

  return (
    <>
      <header
        className={clsx(
          'flex items-center justify-between px-4 lg:px-5 shrink-0 relative',
          'bg-[var(--bg-surface)] border-b border-[var(--border-subtle)]',
          'z-20',
          className
        )}
        style={{ height: 'var(--header-height)', minHeight: 'var(--header-height)' }}
      >
        {/* Left: Title */}
        <div className="flex items-center gap-2">
          <h1
            className="text-sm font-medium text-[var(--text-primary)] leading-none"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {title}
          </h1>
        </div>

        {/* Center: Month selector (variante A) */}
        {showMonth && (
          <div className="absolute left-1/2 -translate-x-1/2">
            <MonthSelector />
          </div>
        )}

        {/* Right: Actions + Notification */}
        <div className="flex items-center gap-1">
          {actions}
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
