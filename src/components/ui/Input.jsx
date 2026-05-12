import { forwardRef } from 'react'
import clsx from 'clsx'

/**
 * Input — campo testo con label, helper text e gestione errori.
 * Compatibile con react-hook-form via ref forwarding.
 */
const Input = forwardRef(function Input(
  { label, error, helper, className, containerClassName, prefix, suffix, ...props },
  ref
) {
  return (
    <div className={clsx('flex flex-col gap-1.5', containerClassName)}>
      {label && (
        <label className="text-sm font-medium text-[var(--text-secondary)]">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {prefix && (
          <span className="absolute left-3 text-[var(--text-muted)] text-sm select-none">
            {prefix}
          </span>
        )}
        <input
          ref={ref}
          className={clsx(
            'w-full h-9 rounded-[var(--radius-md)] border bg-[var(--bg-surface)]',
            'text-[var(--text-primary)] text-base lg:text-sm',
            'transition-all duration-[var(--transition-fast)]',
            'placeholder:text-[var(--text-muted)]',
            'focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent',
            error
              ? 'border-[var(--color-danger)]'
              : 'border-[var(--border-default)] hover:border-[var(--border-strong)]',
            prefix ? 'pl-8' : 'px-3',
            suffix ? 'pr-8' : 'pr-3',
            className
          )}
          {...props}
        />
        {suffix && (
          <span className="absolute right-3 text-[var(--text-muted)] text-sm select-none">
            {suffix}
          </span>
        )}
      </div>
      {error && (
        <p className="text-xs text-[var(--color-danger)]">{error}</p>
      )}
      {helper && !error && (
        <p className="text-xs text-[var(--text-muted)]">{helper}</p>
      )}
    </div>
  )
})

export default Input
