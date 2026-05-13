import { forwardRef } from 'react'
import { motion } from 'framer-motion'
import clsx from 'clsx'

const sizeMap = {
  xs: 'h-7 px-2.5 text-xs gap-1',
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-9 px-4 text-sm gap-2',
  lg: 'h-11 px-5 text-base gap-2',
}

const variantMap = {
  primary: [
    'bg-[#B46243] text-white border-transparent',
    'hover:bg-[#964f34]',
    'active:scale-[0.97]',
  ],
  ghost: [
    'bg-transparent text-[var(--text-primary)] border-transparent',
    'hover:bg-[var(--bg-elevated)]',
    'active:scale-[0.97]',
  ],
  subtle: [
    'bg-[var(--bg-elevated)] text-[var(--text-primary)] border-transparent',
    'hover:bg-[var(--bg-hover)]',
    'active:scale-[0.97]',
  ],
  danger: [
    'bg-[var(--color-danger)] text-white border-transparent',
    'hover:opacity-90',
    'active:scale-[0.97]',
  ],
  primary_ghost: [
    'bg-[var(--color-primary-ghost)] text-[var(--color-primary)] border-transparent',
    'hover:bg-[var(--color-primary-light)]',
    'active:scale-[0.97]',
  ],
}

const Button = forwardRef(function Button(
  {
    children,
    className,
    variant = 'ghost',
    size = 'md',
    loading = false,
    icon: Icon,
    iconRight: IconRight,
    disabled,
    hideTextMobile = false,
    ...props
  },
  ref
) {
  return (
    <motion.button
      ref={ref}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.1 }}
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center font-bold border rounded-[var(--radius-md)]',
        'transition-all duration-[var(--transition-fast)] select-none min-w-[32px]',
        'focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-1',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
        sizeMap[size],
        ...(variantMap[variant] ?? variantMap.ghost),
        className
      )}
      {...props}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        Icon && <Icon size={size === 'xs' ? 12 : size === 'sm' ? 14 : 16} className="shrink-0" />
      )}
      {children && (
        <span className={clsx(hideTextMobile && 'max-sm:hidden')}>
          {children}
        </span>
      )}
      {IconRight && !loading && (
        <IconRight size={size === 'xs' ? 12 : size === 'sm' ? 14 : 16} className="shrink-0" />
      )}
    </motion.button>
  )
})

export default Button
