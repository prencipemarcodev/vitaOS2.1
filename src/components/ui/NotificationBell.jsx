import { motion, AnimatePresence } from 'framer-motion'
import { Bell } from 'lucide-react'
import { useNotifications } from '@/hooks/useNotifications'
import { useEffect, useState } from 'react'

/**
 * NotificationBell — icona campanella con badge rosso pulsante e animazione all'arrivo.
 */
function NotificationBell({ onClick }) {
  const { unreadCount } = useNotifications()
  const [shouldAnimate, setShouldAnimate] = useState(false)

  useEffect(() => {
    if (unreadCount > 0) {
      setShouldAnimate(true)
      const timer = setTimeout(() => setShouldAnimate(false), 500)
      return () => clearTimeout(timer)
    }
  }, [unreadCount])

  return (
    <motion.button
      id="notification-bell"
      onClick={onClick}
      animate={shouldAnimate ? {
        rotate: [0, -10, 10, -10, 10, 0],
        scale: [1, 1.1, 1]
      } : {}}
      transition={{ duration: 0.5 }}
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
            className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[var(--color-danger)]"
          />
        )}
      </AnimatePresence>
    </motion.button>
  )
}

export default NotificationBell
