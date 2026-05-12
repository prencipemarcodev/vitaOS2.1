import { motion } from 'framer-motion'
import { Inbox } from 'lucide-react'

/**
 * EmptyState — illustrazione + testo + CTA opzionale.
 */
function EmptyState({ icon: Icon = Inbox, title, description, action }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center gap-3 py-12 text-center"
    >
      <div className="w-14 h-14 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center">
        <Icon size={24} className="text-[var(--text-muted)]" />
      </div>
      <div>
        <p className="text-sm font-medium text-[var(--text-secondary)]">{title}</p>
        {description && (
          <p className="text-xs text-[var(--text-muted)] mt-0.5">{description}</p>
        )}
      </div>
      {action}
    </motion.div>
  )
}

export default EmptyState
