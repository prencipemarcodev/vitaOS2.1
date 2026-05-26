import { motion, AnimatePresence } from 'framer-motion'
import { X, Check, CheckCheck, AlertCircle, Info, Bell, Sparkles } from 'lucide-react'
import { useNotifications } from '@/hooks/useNotifications'
import Button from './Button'
import clsx from 'clsx'
import { formatDistanceToNow } from 'date-fns'
import { it } from 'date-fns/locale'

const ICON_MAP = {
  'alert-circle': AlertCircle,
  'info': Info,
  'bell': Bell,
  'sparkles': Sparkles,
}

/**
 * NotificationDrawer — pannello laterale destra (non modal, no blur).
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
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="notif-backdrop"
            className="fixed inset-0 z-40 bg-black/20 hidden lg:block"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.aside
            key="notif-drawer"
            className="fixed z-[110] flex flex-col bg-[var(--bg-surface)] inset-0 lg:inset-auto lg:top-0 lg:right-0 lg:bottom-0 lg:w-80 lg:max-w-[90vw]
              lg:my-4 lg:mr-4 lg:rounded-[24px] lg:border lg:border-[var(--border-subtle)] lg:shadow-[0_8px_30px_rgba(0,0,0,0.06)]"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div 
              className="flex items-center justify-between px-4 lg:px-5 shrink-0 border-b border-[var(--border-subtle)] pt-[env(safe-area-inset-top,40px)] lg:pt-0 lg:!h-[var(--header-height)]"
              style={{ height: 'calc(var(--header-height) + env(safe-area-inset-top,40px))' }}
            >
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Notifiche</h3>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="xs" icon={CheckCheck} onClick={markAllAsRead}>
                  Segna tutte
                </Button>
                <Button variant="ghost" size="xs" icon={X} onClick={onClose} />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-[var(--text-muted)]">
                  <Check size={32} strokeWidth={1.5} />
                  <p className="text-sm">Nessuna notifica</p>
                </div>
              ) : (
                <>
                  {today.length > 0 && (
                    <NotifGroup title="Oggi" items={today} onRead={markAsRead} onDismiss={dismiss} onClose={onClose} />
                  )}
                  {older.length > 0 && (
                    <NotifGroup title="Precedenti" items={older} onRead={markAsRead} onDismiss={dismiss} onClose={onClose} />
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

function NotifGroup({ title, items, onRead, onDismiss, onClose }) {
  return (
    <div>
      <p className="px-4 py-2 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
        {title}
      </p>
      {items.map((n) => (
        <NotifItem key={n.id} notification={n} onRead={onRead} onDismiss={onDismiss} onClose={onClose} />
      ))}
    </div>
  )
}

function NotifItem({ notification: n, onRead, onDismiss, onClose }) {
  const Icon = ICON_MAP[n.icon] || Bell

  const handleClick = () => {
    onRead(n.id)
    if (n.action) {
      n.action()
    }
    onClose()
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: n.read ? 0.5 : 1, x: 0 }}
      exit={{ opacity: 0, height: 0 }}
      className={clsx(
        'flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-[var(--bg-elevated)] transition-colors border-b border-[var(--border-subtle)] last:border-0'
      )}
      onClick={handleClick}
    >
      <div className={clsx(
        'w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5',
        n.type === 'error' ? 'bg-[var(--color-danger-ghost)] text-[var(--color-danger)]' : 'bg-[var(--color-info-ghost)] text-[var(--color-info)]'
      )}>
        <Icon size={14} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-[var(--text-primary)] leading-snug">{n.message}</p>
        <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
          {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: it })}
        </p>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onDismiss(n.id) }}
        className="shrink-0 p-0.5 rounded text-[var(--text-muted)] hover:text-[var(--color-danger)] transition-colors"
      >
        <X size={12} />
      </button>
    </motion.div>
  )
}

export default NotificationDrawer
