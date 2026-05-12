import { motion, AnimatePresence } from 'framer-motion'
import { X, Check, CheckCheck } from 'lucide-react'
import { useNotifications } from '@/hooks/useNotifications'
import Button from './Button'
import clsx from 'clsx'
import { formatDistanceToNow } from 'date-fns'
import { it } from 'date-fns/locale'

/**
 * NotificationDrawer — pannello laterale destra (non modal, no blur).
 * Si apre sopra il contenuto senza blurrare la pagina.
 */
function NotificationDrawer({ isOpen, onClose }) {
  const { notifications, markAsRead, markAllAsRead, dismiss } = useNotifications()

  const today = notifications.filter((n) => {
    const d = new Date(n.createdAt)
    const now = new Date()
    return d.toDateString() === now.toDateString()
  })
  const older = notifications.filter((n) => {
    const d = new Date(n.createdAt)
    const now = new Date()
    return d.toDateString() !== now.toDateString()
  })

  return (
    <>
      {/* Backdrop leggero — non blur */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="notif-backdrop"
            className="fixed inset-0 z-40 bg-black/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.aside
            key="notif-drawer"
            className="fixed top-0 right-0 bottom-0 z-50 w-80 max-w-[90vw]
              bg-[var(--bg-surface)] border-l border-[var(--border-subtle)]
              shadow-[var(--shadow-lg)] flex flex-col"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-[var(--border-subtle)] shrink-0">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Notifiche</h3>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="xs"
                  icon={CheckCheck}
                  onClick={markAllAsRead}
                >
                  Segna tutte
                </Button>
                <Button variant="ghost" size="xs" icon={X} onClick={onClose} aria-label="Chiudi" />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-[var(--text-muted)]">
                  <Check size={32} strokeWidth={1.5} />
                  <p className="text-sm">Nessuna notifica</p>
                </div>
              ) : (
                <>
                  {today.length > 0 && (
                    <NotifGroup title="Oggi" items={today} onRead={markAsRead} onDismiss={dismiss} />
                  )}
                  {older.length > 0 && (
                    <NotifGroup title="Precedenti" items={older} onRead={markAsRead} onDismiss={dismiss} />
                  )}
                </>
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  )
}

function NotifGroup({ title, items, onRead, onDismiss }) {
  return (
    <div>
      <p className="px-4 py-2 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
        {title}
      </p>
      {items.map((n) => (
        <NotifItem key={n.id} notification={n} onRead={onRead} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

function NotifItem({ notification: n, onRead, onDismiss }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: n.read ? 0.5 : 1, x: 0 }}
      exit={{ opacity: 0, height: 0 }}
      className={clsx(
        'flex items-start gap-3 px-4 py-3 cursor-pointer',
        'hover:bg-[var(--bg-elevated)] transition-colors',
        'border-b border-[var(--border-subtle)] last:border-0'
      )}
      onClick={() => onRead(n.id)}
    >
      <span className="text-lg shrink-0 mt-0.5">{n.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-[var(--text-primary)] leading-snug">{n.message}</p>
        <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
          {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: it })}
        </p>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onDismiss(n.id) }}
        className="shrink-0 p-0.5 rounded text-[var(--text-muted)] hover:text-[var(--color-danger)] transition-colors"
        aria-label="Rimuovi notifica"
      >
        <X size={12} />
      </button>
    </motion.div>
  )
}

export default NotificationDrawer
