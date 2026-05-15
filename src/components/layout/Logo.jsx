import { useAppStore } from '@/store/useAppStore'
import clsx from 'clsx'

export default function Logo({ className, style, name: propName }) {
  const { userConfig } = useAppStore()
  const name = propName || userConfig?.first_name || 'vita'

  return (
    <span
      className={clsx(
        "font-semibold text-[var(--text-primary)] whitespace-nowrap",
        className
      )}
      style={{ 
        fontFamily: 'var(--font-display)',
        ...style 
      }}
    >
      {name}<span style={{ color: 'var(--color-primary)' }}>OS</span>
    </span>
  )
}
