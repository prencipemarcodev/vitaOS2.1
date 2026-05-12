import { useState } from 'react'
import NotificationBell from '@/components/ui/NotificationBell'
import NotificationDrawer from '@/components/ui/NotificationDrawer'
import MonthSelector from './MonthSelector'
import clsx from 'clsx'

/**
 * Header — layout riorganizzato: [Titolo] [Mese Anno ◀ ▶] [Azioni]
 */
function Header({ title, showMonth = false, showNotification = false, actions, className }) {
  const [notifOpen, setNotifOpen] = useState(false)

  return (
    <>
      <header
        className={clsx(
          'flex items-center justify-between px-4 lg:px-5 shrink-0 z-20',
          'bg-white border-b border-[var(--border-subtle)] shadow-sm',
          className
        )}
        style={{ height: 'var(--header-height)', minHeight: 'var(--header-height)' }}
      >
        {/* Left: Title */}
        <div className="flex items-center gap-4 shrink-0">
          <h1
            className="text-sm font-bold text-[var(--text-primary)] leading-none"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {title}
          </h1>

          {/* Month selector (inline) */}
          {showMonth && (
            <div className="hidden sm:block">
              <MonthSelector />
            </div>
          )}
        </div>

        {/* Center: Mobile Month selector */}
        {showMonth && (
          <div className="sm:hidden flex-1 flex justify-center px-2 overflow-hidden">
            <MonthSelector />
          </div>
        )}

        {/* Right: Actions + Notification */}
        <div className="flex items-center gap-2 shrink-0">
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
