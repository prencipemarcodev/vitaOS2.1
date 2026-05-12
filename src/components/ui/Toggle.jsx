import { motion } from 'framer-motion'
import clsx from 'clsx'

/**
 * Toggle — switch on/off animato con Framer Motion.
 */
function Toggle({ checked, onChange, disabled = false, label, size = 'md', className }) {
  const sizes = {
    sm: { track: 'w-8 h-4', thumb: 'w-3 h-3', translate: 'translateX(16px)' },
    md: { track: 'w-10 h-5', thumb: 'w-3.5 h-3.5', translate: 'translateX(20px)' },
    lg: { track: 'w-12 h-6', thumb: 'w-4.5 h-4.5', translate: 'translateX(24px)' },
  }
  const s = sizes[size]

  return (
    <label className={clsx('inline-flex items-center gap-2 cursor-pointer select-none', disabled && 'opacity-50 cursor-not-allowed', className)}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange?.(!checked)}
        className={clsx(
          'relative inline-flex shrink-0 rounded-full p-0.5 transition-colors duration-200',
          s.track,
          checked ? 'bg-[var(--color-primary)]' : 'bg-[var(--bg-hover)] border border-[var(--border-default)]'
        )}
      >
        <motion.span
          className={clsx('rounded-full bg-white shadow-sm', s.thumb)}
          animate={{ x: checked ? (size === 'sm' ? 16 : size === 'md' ? 20 : 24) : 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </button>
      {label && (
        <span className="text-sm text-[var(--text-primary)]">{label}</span>
      )}
    </label>
  )
}

export default Toggle
