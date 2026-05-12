import { forwardRef } from 'react'
import { motion } from 'framer-motion'
import clsx from 'clsx'

/**
 * Card — contenitore base con shadow, radius e hover lift opzionale.
 * @param {boolean} hoverable  — aggiunge translateY(-2px) al hover
 * @param {boolean} glass      — effetto glassmorphism
 * @param {'sm'|'md'|'lg'|'none'} padding
 */
const Card = forwardRef(function Card(
  { children, className, hoverable = false, glass = false, padding = 'md', as = 'div', ...props },
  ref
) {
  const paddingMap = {
    none: '',
    sm:   'p-3',
    md:   'p-4',
    lg:   'p-6',
  }

  const base = clsx(
    'rounded-[var(--radius-lg)] border border-[var(--border-subtle)]',
    'bg-[var(--bg-surface)] shadow-[var(--shadow-sm)]',
    'transition-all duration-[var(--transition-base)]',
    paddingMap[padding],
    hoverable && 'cursor-pointer hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]',
    glass && 'backdrop-blur-md bg-white/60 dark:bg-black/30',
    className
  )

  const Component = hoverable ? motion.div : as

  if (hoverable) {
    return (
      <motion.div
        ref={ref}
        className={base}
        whileHover={{ y: -2, boxShadow: 'var(--shadow-md)' }}
        transition={{ duration: 0.15 }}
        {...props}
      >
        {children}
      </motion.div>
    )
  }

  return (
    <div ref={ref} className={base} {...props}>
      {children}
    </div>
  )
})

export default Card
