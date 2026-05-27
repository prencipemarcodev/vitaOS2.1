import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, AlertCircle, HelpCircle } from 'lucide-react'
import { useConfirmStore } from '@/store/useConfirmStore'

function ConfirmationModal() {
  const { isOpen, title, message, confirmText, cancelText, variant, onConfirm, onCancel } = useConfirmStore()

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
          onClick={onCancel}
        >
          <motion.div
            initial={{ y: 60, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 60, opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 450, damping: 30 }}
            className="w-full max-w-sm bg-[var(--bg-surface)] rounded-[32px] p-6 shadow-2xl border border-[var(--border-subtle)] relative overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header Icon */}
            <div className="flex flex-col items-center text-center gap-4 mb-4">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
                variant === 'danger'
                  ? 'bg-red-50 dark:bg-red-950/20 text-red-500'
                  : variant === 'warning'
                    ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-500'
                    : 'bg-[var(--color-primary-ghost)] text-[var(--color-primary)]'
              }`}>
                {variant === 'danger' ? (
                  <AlertCircle size={28} />
                ) : variant === 'warning' ? (
                  <AlertTriangle size={28} />
                ) : (
                  <HelpCircle size={28} />
                )}
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-black text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
                  {title}
                </h3>
                {message && (
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed px-2">
                    {message}
                  </p>
                )}
              </div>
            </div>

            {/* Actions Stack */}
            <div className="flex flex-col gap-2.5 mt-6">
              <button
                onClick={onConfirm}
                className={`w-full py-3.5 rounded-2xl text-white text-sm font-black shadow-lg transition-all active:scale-[0.97] ${
                  variant === 'danger'
                    ? 'bg-red-500 hover:bg-red-600 shadow-red-500/10'
                    : variant === 'warning'
                      ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/10'
                      : 'bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] shadow-[var(--color-primary-ghost)]'
                }`}
              >
                {confirmText}
              </button>
              
              <button
                onClick={onCancel}
                className="w-full py-3.5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] text-sm font-black text-[var(--text-secondary)] transition-all active:scale-[0.97]"
              >
                {cancelText}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default ConfirmationModal
