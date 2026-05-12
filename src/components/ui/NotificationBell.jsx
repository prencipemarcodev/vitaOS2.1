import { motion, AnimatePresence } from 'framer-motion'
import { Bell } from 'lucide-react'
import { useNotifications } from '@/hooks/useNotifications'

/**
 * NotificationBell — icona campanella con badge rosso pulsante.
 */
function NotificationBell({ onClick }) {
  const { unreadCount } = useNotifications()

  return (
    <button
      id="notification-bell"
      onClick={onClick}
      className="relative p-2 rounded-[var(--radius-md)] text-[var(--text-secondary)]
        hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]
        transition-colors duration-[var(--transition-fast)]"
      aria-label={`Notifiche${unreadCount > 0 ? ` — ${unreadCount} non lette` : ''}`}
    >
      <Bell size={20} />
      <AnimatePresence>
        {unreadCount > 0 && (
          <motion.span
            key="badge"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[var(--color-danger)] animate-pulse-dot"
          />
        )}
      </AnimatePresence>
    </button>
  )
}

export default NotificationBell
