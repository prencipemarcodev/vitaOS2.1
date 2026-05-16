import clsx from 'clsx'

const sizeMap = {
  xs: 'h-4 px-1.5 text-[10px]',
  sm: 'h-5 px-2 text-xs',
  md: 'h-6 px-2.5 text-xs',
}

/**
 * Badge — pill colorata per categoria/stato.
 * @param {'lavoro'|'studio'|'esercizio'|'salute'|'personale'|'ferie'|'malattia'|'altro'} category
 * @param {string} color — override CSS color
 */
function Badge({ children, className, category, color, size = 'md', dot = false, ...props }) {
  const categoryColors = {
    lavoro:    { bg: 'rgba(180,98,67,0.15)',  text: 'rgb(180,98,67)' },
    studio:    { bg: 'rgba(74,144,217,0.15)', text: '#4a90d9' },
    esercizio: { bg: 'rgba(61,153,112,0.15)', text: '#3d9970' },
    salute:    { bg: 'rgba(224,82,82,0.15)',  text: '#e05252' },
    personale: { bg: 'rgba(155,89,182,0.15)', text: '#9b59b6' },
    ferie:     { bg: 'rgba(212,160,23,0.15)', text: '#d4a017' },
    malattia:  { bg: 'rgba(127,140,141,0.15)',text: '#7f8c8d' },
    palestra:  { bg: 'rgba(46,204,113,0.15)', text: '#2ecc71' },
    altro:     { bg: 'rgba(149,165,166,0.15)',text: '#95a5a6' },
    success:   { bg: 'rgba(61,153,112,0.15)', text: '#3d9970' },
    danger:    { bg: 'rgba(224,82,82,0.15)',  text: '#e05252' },
    warning:   { bg: 'rgba(212,160,23,0.15)', text: '#d4a017' },
    info:      { bg: 'rgba(74,144,217,0.15)', text: '#4a90d9' },
  }

  const style = category ? categoryColors[category] : null

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 font-medium rounded-full select-none',
        sizeMap[size],
        !style && !color && 'bg-[var(--bg-elevated)] text-[var(--text-secondary)]',
        className
      )}
      style={style ? { backgroundColor: style.bg, color: style.text } : color ? { backgroundColor: `${color}22`, color } : undefined}
      {...props}
    >
      {dot && (
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={style ? { backgroundColor: style.text } : color ? { backgroundColor: color } : undefined}
        />
      )}
      {children}
    </span>
  )
}

export default Badge
