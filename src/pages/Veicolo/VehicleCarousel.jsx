import { useRef, useState, useCallback, useEffect } from 'react'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { Plus, Edit2, ChevronLeft, ChevronRight } from 'lucide-react'
import clsx from 'clsx'

// ── Mini Car SVG (used in each carousel card) ──────────────────
function MiniCar({ color = '#9aacc8' }) {
  // Build a tinted version: keep structure, apply user color
  return (
    <svg viewBox="0 0 160 70" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', maxWidth: 130 }} aria-hidden="true">
      <defs>
        <linearGradient id={`mc-body-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.95" />
          <stop offset="100%" stopColor={color} stopOpacity="0.65" />
        </linearGradient>
        <linearGradient id={`mc-roof-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="1" />
          <stop offset="100%" stopColor={color} stopOpacity="0.75" />
        </linearGradient>
      </defs>
      <ellipse cx="80" cy="68" rx="66" ry="4" fill="rgba(0,0,0,0.10)" />
      <path d="M16 48 L16 40 Q18 34 26 32 L32 31 L130 31 L137 33 L142 40 L142 48 Z" fill={`url(#mc-body-${color})`} />
      <path d="M44 31 L52 17 Q56 14 60 13 L100 13 Q104 13 107 16 L118 31 Z" fill={`url(#mc-roof-${color})`} />
      <path d="M100 13 Q104 13 107 16 L118 31 L107 31 Z" fill="rgba(150,210,255,0.22)" stroke="rgba(150,210,255,0.25)" strokeWidth="0.4" />
      <path d="M44 31 L52 17 Q56 14 60 13 L55 31 Z" fill="rgba(150,210,255,0.18)" stroke="rgba(150,210,255,0.2)" strokeWidth="0.4" />
      <rect x="57" y="15" width="44" height="15" rx="2" fill="rgba(130,200,255,0.16)" stroke="rgba(150,210,255,0.18)" strokeWidth="0.4" />
      <circle cx="113" cy="52" r="11" fill="#2a2a38" />
      <circle cx="113" cy="52" r="7" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
      <circle cx="113" cy="52" r="4" fill="#48485a" />
      <circle cx="45" cy="52" r="11" fill="#2a2a38" />
      <circle cx="45" cy="52" r="7" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
      <circle cx="45" cy="52" r="4" fill="#48485a" />
      <path d="M134 34 L140 37 L138 41 L130 40 Z" fill="rgba(255,245,180,0.85)" />
      <path d="M26 32 L17 36 L17 41 L28 40 Z" fill="rgba(220,60,60,0.8)" />
      <path d="M16 40 L142 40" stroke="rgba(255,255,255,0.1)" strokeWidth="0.8" />
    </svg>
  )
}

// ── Carousel ───────────────────────────────────────────────────
function VehicleCarousel({ vehicles, activeIndex, onSelect, onAdd, onEdit }) {
  const CARD_W = 220
  const CARD_GAP = 12
  const STEP = CARD_W + CARD_GAP

  const containerRef = useRef(null)
  const x = useMotionValue(0)
  const [isDragging, setIsDragging] = useState(false)
  const dragStartX = useRef(0)

  // ── Snap to index ───────────────────────────────────────────
  const snapTo = useCallback((idx) => {
    const clampedIdx = Math.max(0, Math.min(idx, vehicles.length)) // include +1 for "add" card
    onSelect(Math.min(clampedIdx, vehicles.length - 1))
    const containerW = containerRef.current?.clientWidth ?? 360
    const target = -(clampedIdx * STEP) + (containerW / 2) - (CARD_W / 2)
    animate(x, target, { type: 'spring', stiffness: 320, damping: 32 })
  }, [vehicles.length, x, onSelect, STEP, CARD_W])

  // ── Posizione iniziale al mount ─────────────────────────────
  // x parte da 0 (left edge): impostiamo subito il centramento
  // sull'auto attiva dopo il primo render (clientWidth disponibile)
  useEffect(() => {
    const containerW = containerRef.current?.clientWidth ?? 360
    const target = -(activeIndex * STEP) + (containerW / 2) - (CARD_W / 2)
    x.set(target) // immediato, senza animazione
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // solo al mount

  // ── Sync on external activeIndex change ─────────────────────
  const prevIndex = useRef(activeIndex)
  if (prevIndex.current !== activeIndex) {
    prevIndex.current = activeIndex
    const containerW = containerRef.current?.clientWidth ?? 360
    const target = -(activeIndex * STEP) + (containerW / 2) - (CARD_W / 2)
    animate(x, target, { type: 'spring', stiffness: 320, damping: 32 })
  }

  // ── Drag handlers (desktop + mobile via Framer Motion) ──────
  const handleDragStart = () => {
    setIsDragging(true)
    dragStartX.current = x.get()
  }

  const handleDragEnd = (_, info) => {
    setIsDragging(false)
    const velocity = info.velocity.x
    const offset = info.offset.x

    let newIndex = activeIndex
    if (Math.abs(velocity) > 300) {
      // Flick gesture
      newIndex = velocity < 0
        ? Math.min(activeIndex + 1, vehicles.length - 1)
        : Math.max(activeIndex - 1, 0)
    } else if (Math.abs(offset) > CARD_W / 3) {
      // Drag distance
      newIndex = offset < 0
        ? Math.min(activeIndex + 1, vehicles.length - 1)
        : Math.max(activeIndex - 1, 0)
    }
    snapTo(newIndex)
  }

  // ── Mouse wheel (desktop) ────────────────────────────────────
  const handleWheel = useCallback((e) => {
    e.preventDefault()
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
    if (delta > 30) snapTo(Math.min(activeIndex + 1, vehicles.length - 1))
    else if (delta < -30) snapTo(Math.max(activeIndex - 1, 0))
  }, [activeIndex, vehicles.length, snapTo])

  const totalItems = vehicles.length + 1 // +1 for the Add card

  return (
    <div className="relative select-none">
      {/* Track */}
      <div
        ref={containerRef}
        className="overflow-hidden py-4"
        onWheel={handleWheel}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <motion.div
          className="flex items-center"
          style={{ x, gap: CARD_GAP }}
          drag="x"
          dragConstraints={{ left: -(STEP * (totalItems - 1)), right: STEP }}
          dragElastic={0.08}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          whileDrag={{ cursor: 'grabbing' }}
        >
          {vehicles.map((v, i) => {
            const isActive = i === activeIndex
            return (
              <motion.div
                key={v.id}
                onClick={() => !isDragging && snapTo(i)}
                animate={{
                  scale: isActive ? 1 : 0.88,
                  opacity: isActive ? 1 : 0.55,
                  y: isActive ? 0 : 6,
                }}
                transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                style={{ width: CARD_W, flexShrink: 0 }}
                className={clsx(
                  'rounded-[var(--radius-xl)] border p-4 transition-colors duration-200',
                  'bg-[var(--bg-surface)] shadow-[var(--shadow-md)]',
                  isActive
                    ? 'border-[var(--border-default)]'
                    : 'border-[var(--border-subtle)] cursor-pointer'
                )}
              >
                {/* Car preview */}
                <div
                  className="rounded-[var(--radius-lg)] flex items-center justify-center py-3 mb-3"
                  style={{ background: `${v.color}14` }}
                >
                  <MiniCar color={v.color} />
                </div>

                {/* Info */}
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-black text-[var(--text-primary)] truncate">{v.name}</p>
                    <p className="text-[11px] text-[var(--text-muted)] font-medium mt-0.5 truncate">
                      {[v.brand, v.model, v.year].filter(Boolean).join(' · ') || 'Nessun dettaglio'}
                    </p>
                    {v.plate && (
                      <span className="inline-block mt-1.5 text-[9px] font-black tracking-widest px-2 py-0.5 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-md text-[var(--text-muted)] font-mono">
                        {v.plate}
                      </span>
                    )}
                  </div>
                  {isActive && (
                    <button
                      onPointerDown={e => e.stopPropagation()}
                      onClick={e => { e.stopPropagation(); onEdit(v) }}
                      className="ml-2 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] transition-colors shrink-0"
                    >
                      <Edit2 size={13} />
                    </button>
                  )}
                </div>

                {/* Fuel badge */}
                <div className="mt-2.5 flex items-center gap-1.5">
                  <span className="text-[9px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full bg-[var(--bg-elevated)] text-[var(--text-muted)]">
                    {v.fuel_type === 'gasoline' ? '⛽ Benzina'
                      : v.fuel_type === 'diesel' ? '🛢️ Diesel'
                        : v.fuel_type === 'electric' ? '⚡ Elettrico'
                          : '🔋 Ibrido'}
                  </span>
                </div>
              </motion.div>
            )
          })}

          {/* Add card */}
          <motion.div
            onClick={() => !isDragging && onAdd()}
            animate={{ scale: 0.88, opacity: 0.6 }}
            whileHover={{ scale: 0.92, opacity: 0.85 }}
            style={{ width: CARD_W, flexShrink: 0 }}
            className="rounded-[var(--radius-xl)] border-2 border-dashed border-[var(--border-default)] p-4 flex flex-col items-center justify-center gap-2 cursor-pointer min-h-[160px] transition-colors hover:bg-[var(--bg-elevated)]"
          >
            <div className="w-10 h-10 rounded-full bg-[var(--color-primary-ghost)] flex items-center justify-center">
              <Plus size={18} className="text-[var(--color-primary)]" />
            </div>
            <p className="text-xs font-bold text-[var(--text-muted)] text-center">Aggiungi auto</p>
          </motion.div>
        </motion.div>
      </div>

      {/* Arrow controls (visible on desktop hover) */}
      <div className="hidden lg:flex items-center justify-between absolute top-1/2 -translate-y-1/2 left-0 right-0 pointer-events-none px-1">
        <button
          onClick={() => snapTo(Math.max(activeIndex - 1, 0))}
          className={clsx(
            'pointer-events-auto w-8 h-8 rounded-full flex items-center justify-center',
            'bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-[var(--shadow-sm)]',
            'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--border-default)]',
            'transition-all duration-150',
            activeIndex === 0 && 'opacity-30 pointer-events-none'
          )}
        >
          <ChevronLeft size={14} />
        </button>
        <button
          onClick={() => snapTo(Math.min(activeIndex + 1, vehicles.length - 1))}
          className={clsx(
            'pointer-events-auto w-8 h-8 rounded-full flex items-center justify-center',
            'bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-[var(--shadow-sm)]',
            'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--border-default)]',
            'transition-all duration-150',
            activeIndex === vehicles.length - 1 && 'opacity-30 pointer-events-none'
          )}
        >
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Dot indicators */}
      {vehicles.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 pb-1">
          {vehicles.map((v, i) => (
            <button
              key={v.id}
              onClick={() => snapTo(i)}
              className={clsx(
                'rounded-full transition-all duration-300',
                i === activeIndex
                  ? 'w-4 h-1.5 bg-[var(--color-primary)]'
                  : 'w-1.5 h-1.5 bg-[var(--border-default)] hover:bg-[var(--text-muted)]'
              )}
              aria-label={`Vai a ${v.name}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default VehicleCarousel
