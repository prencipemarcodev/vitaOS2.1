import clsx from 'clsx'

/**
 * Skeleton — placeholder shimmer per stati di caricamento.
 */
function Skeleton({ className, width, height, circle = false }) {
  return (
    <div
      className={clsx(
        'skeleton rounded-[var(--radius-md)]',
        circle && 'rounded-full',
        className
      )}
      style={{ width, height }}
    />
  )
}

export function SkeletonCard({ rows = 3 }) {
  return (
    <div className="p-4 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] space-y-3">
      <Skeleton height="1rem" width="60%" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} height="0.75rem" width={`${80 - i * 10}%`} />
      ))}
    </div>
  )
}

export default Skeleton
