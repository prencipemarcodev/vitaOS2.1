import { useState, useEffect, useRef } from 'react'
import clsx from 'clsx'
import { Plus, Trash2 } from 'lucide-react'
import Toggle from './Toggle'

const DAYS = [
  { key: '1', label: 'Lun', short: 'L' },
  { key: '2', label: 'Mar', short: 'M' },
  { key: '3', label: 'Mer', short: 'M' },
  { key: '4', label: 'Gio', short: 'G' },
  { key: '5', label: 'Ven', short: 'V' },
  { key: '6', label: 'Sab', short: 'S' },
  { key: '0', label: 'Dom', short: 'D' },
]

const WEEKDAYS = [
  { key: 0, label: 'Lun', short: 'L' },
  { key: 1, label: 'Mar', short: 'M' },
  { key: 2, label: 'Mer', short: 'M' },
  { key: 3, label: 'Gio', short: 'G' },
  { key: 4, label: 'Ven', short: 'V' },
  { key: 5, label: 'Sab', short: 'S' },
  { key: 6, label: 'Dom', short: 'D' },
]

// Bidirectional translation functions
function parseWorkSchedule(value) {
  if (!value || Object.keys(value).length === 0) {
    return [
      {
        id: 1,
        days: new Set([0, 1, 2, 3, 4]), // Mon-Fri
        entry: 8 * 60 + 30, // 08:30
        exit: 17 * 60 + 30, // 17:30
      }
    ]
  }

  const groups = {}
  let hasEnabled = false

  for (let d = 0; d < 7; d++) {
    const dbKey = d === 6 ? '0' : String(d + 1)
    const dayData = value[dbKey]
    if (dayData?.enabled && dayData.from && dayData.to) {
      hasEnabled = true
      const key = `${dayData.from}-${dayData.to}`
      if (!groups[key]) {
        const [fh, fm] = dayData.from.split(':').map(Number)
        const [th, tm] = dayData.to.split(':').map(Number)
        groups[key] = {
          entry: fh * 60 + fm,
          exit: th * 60 + tm,
          days: []
        }
      }
      groups[key].days.push(d)
    }
  }

  if (!hasEnabled) {
    return [
      {
        id: 1,
        days: new Set([0, 1, 2, 3, 4]), // Mon-Fri
        entry: 8 * 60 + 30,
        exit: 17 * 60 + 30,
      }
    ]
  }

  return Object.values(groups).map((group, index) => ({
    id: index + 1,
    days: new Set(group.days),
    entry: group.entry,
    exit: group.exit
  }))
}

function convertFasceToSchedule(fasceList) {
  const workSchedule = {}
  const dayKeys = ['1', '2', '3', '4', '5', '6', '0']
  dayKeys.forEach(k => {
    workSchedule[k] = { enabled: false }
  })

  fasceList.forEach(f => {
    f.days.forEach(d => {
      const dbKey = d === 6 ? '0' : String(d + 1)
      const entryH = Math.floor(f.entry / 60)
      const entryM = f.entry % 60
      const exitH = Math.floor(f.exit / 60)
      const exitM = f.exit % 60
      const fromStr = `${String(entryH).padStart(2, '0')}:${String(entryM).padStart(2, '0')}`
      const toStr = `${String(exitH).padStart(2, '0')}:${String(exitM).padStart(2, '0')}`
      workSchedule[dbKey] = {
        enabled: true,
        from: fromStr,
        to: toStr
      }
    })
  })
  return workSchedule
}

/**
 * ArcKnob — Premium circular dial time selector.
 */
function ArcKnob({ value, onChange, label, disabled = false }) {
  const svgRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)

  // Convert minutes (0 - 1440) to angle (135 - 405)
  const currentAngle = 135 + (value / 1440) * 270

  // Format time (HH:MM)
  const hours = Math.floor(value / 60)
  const minutes = value % 60
  const formattedTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`

  const polarToCartesian = (cx, cy, r, angleInDegrees) => {
    const angleInRadians = (angleInDegrees * Math.PI) / 180.0
    return {
      x: cx + r * Math.cos(angleInRadians),
      y: cy + r * Math.sin(angleInRadians),
    }
  }

  const describeArc = (cx, cy, r, startAngle, endAngle) => {
    const start = polarToCartesian(cx, cy, r, startAngle)
    const end = polarToCartesian(cx, cy, r, endAngle)
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1'
    return [
      'M', start.x, start.y,
      'A', r, r, 0, largeArcFlag, 1, end.x, end.y
    ].join(' ')
  }

  const handlePointerDown = (e) => {
    if (disabled) return
    e.preventDefault()
    setIsDragging(true)

    const updateFromPointer = (clientX, clientY) => {
      if (!svgRef.current) return
      const rect = svgRef.current.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2

      const dx = clientX - centerX
      const dy = clientY - centerY
      const angleRad = Math.atan2(dy, dx)
      const angleDeg = (angleRad * 180) / Math.PI
      const deg = (angleDeg + 360) % 360

      let dialAngle
      if (deg >= 135) {
        dialAngle = deg
      } else if (deg <= 45) {
        dialAngle = deg + 360
      } else {
        // Dead zone snap
        if (deg < 90) {
          dialAngle = 405
        } else {
          dialAngle = 135
        }
      }

      const ratio = (dialAngle - 135) / 270
      let mins = ratio * 1440
      mins = Math.round(mins / 15) * 15
      mins = Math.max(0, Math.min(1440, mins))

      onChange(mins)
    }

    updateFromPointer(e.clientX, e.clientY)

    const handlePointerMove = (moveEvent) => {
      updateFromPointer(moveEvent.clientX, moveEvent.clientY)
    }

    const handlePointerUp = () => {
      setIsDragging(false)
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
  }

  const trackPath = describeArc(60, 60, 42, 135, 405)
  const valuePath = currentAngle > 135 ? describeArc(60, 60, 42, 135, currentAngle) : ''
  const thumbPos = polarToCartesian(60, 60, 42, currentAngle)

  return (
    <div className="flex flex-col items-center select-none w-[110px] sm:w-[125px]">
      <div className="relative">
        <svg
          ref={svgRef}
          width="110"
          height="110"
          viewBox="0 0 120 120"
          className={clsx(
            "cursor-pointer touch-none transition-transform duration-200",
            isDragging && "scale-[1.03]"
          )}
          onPointerDown={handlePointerDown}
        >
          {/* Background Track */}
          <path
            d={trackPath}
            fill="none"
            stroke="var(--border-default)"
            strokeWidth="8"
            strokeLinecap="round"
            className="opacity-40 dark:opacity-20"
          />

          {/* Value Path */}
          {valuePath && (
            <path
              d={valuePath}
              fill="none"
              stroke="var(--color-primary)"
              strokeWidth="8"
              strokeLinecap="round"
              className="transition-all duration-75"
            />
          )}

          {/* Thumb */}
          <circle
            cx={thumbPos.x}
            cy={thumbPos.y}
            r="8"
            fill="var(--bg-surface)"
            stroke="var(--color-primary)"
            strokeWidth="3.5"
            className={clsx(
              "shadow-sm transition-all duration-75",
              isDragging && "fill-[var(--color-primary-light)] scale-110"
            )}
            style={{ transformOrigin: `${thumbPos.x}px ${thumbPos.y}px` }}
          />

          {/* Inner labels */}
          <text
            x="60"
            y="52"
            textAnchor="middle"
            className="text-[9px] font-black tracking-wider fill-[var(--text-muted)]"
          >
            {label}
          </text>
          <text
            x="60"
            y="74"
            textAnchor="middle"
            className="text-lg font-black fill-[var(--text-primary)]"
          >
            {formattedTime}
          </text>
        </svg>
      </div>
    </div>
  )
}

/**
 * TimeBlockSelector — Card-grid or dynamic time band scheduler.
 */
function TimeBlockSelector({ mode = 'work', value = {}, onChange }) {
  const accentMap = {
    work:  { bg: 'rgba(180,98,67,0.08)',  border: 'rgba(180,98,67,0.3)',  dot: 'var(--color-primary)' },
    study: { bg: 'rgba(155,89,182,0.08)', border: 'rgba(155,89,182,0.3)', dot: '#9b59b6' },
    gym:   { bg: 'rgba(61,153,112,0.08)', border: 'rgba(61,153,112,0.3)', dot: '#3d9970' },
  }
  const accent = accentMap[mode]

  // Fasce Orarie (dynamic work bands) local state
  const [fasce, setFasce] = useState(() => parseWorkSchedule(value))

  // Synchronize when value changes from outside (e.g., store resets)
  useEffect(() => {
    if (mode === 'work') {
      const currentConverted = convertFasceToSchedule(fasce)
      if (JSON.stringify(value) !== JSON.stringify(currentConverted)) {
        setFasce(parseWorkSchedule(value))
      }
    }
  }, [value, mode])

  const updateDay = (dayKey, updates) => {
    onChange({ ...value, [dayKey]: { ...value[dayKey], ...updates } })
  }

  // Work Schedule Handlers
  const updateFascia = (id, updates) => {
    setFasce(prev => {
      const next = prev.map(f => (f.id === id ? { ...f, ...updates } : f))
      onChange(convertFasceToSchedule(next))
      return next
    })
  }

  const handleDayClick = (fasciaId, dayIdx) => {
    const targetFascia = fasce.find(f => f.id === fasciaId)
    if (!targetFascia) return

    const isSelected = targetFascia.days.has(dayIdx)
    let nextFasce

    if (isSelected) {
      if (targetFascia.days.size === 1) return // Deseleziona ultimo giorno: ignorato
      nextFasce = fasce.map(f => {
        if (f.id === fasciaId) {
          const nextDays = new Set(f.days)
          nextDays.delete(dayIdx)
          return { ...f, days: nextDays }
        }
        return f
      })
    } else {
      // Find who currently owns this day
      const otherFascia = fasce.find(f => f.id !== fasciaId && f.days.has(dayIdx))
      if (otherFascia && otherFascia.days.size === 1) {
        // Removing it would leave other fascia with 0 days: ignored
        return
      }

      nextFasce = fasce.map(f => {
        if (f.id === fasciaId) {
          const nextDays = new Set(f.days)
          nextDays.add(dayIdx)
          return { ...f, days: nextDays }
        }
        if (otherFascia && f.id === otherFascia.id) {
          const nextDays = new Set(f.days)
          nextDays.delete(dayIdx)
          return { ...f, days: nextDays }
        }
        return f
      })
    }

    setFasce(nextFasce)
    onChange(convertFasceToSchedule(nextFasce))
  }

  const handleAddFascia = () => {
    const assignedDays = new Set()
    fasce.forEach(f => f.days.forEach(d => assignedDays.add(d)))
    let newDays = [0, 1, 2, 3, 4, 5, 6].filter(d => !assignedDays.has(d))

    if (newDays.length === 0) {
      // All days occupied: try to take Saturday/Sunday (5, 6) if safe
      const candidates = [5, 6]
      const allowedCandidates = []
      candidates.forEach(c => {
        const owner = fasce.find(f => f.days.has(c))
        if (owner && owner.days.size > 1) {
          allowedCandidates.push(c)
        }
      })

      if (allowedCandidates.length > 0) {
        newDays = allowedCandidates
      } else {
        // Take any first day that can be safely reassigned
        for (let d = 0; d < 7; d++) {
          const owner = fasce.find(f => f.days.has(d))
          if (owner && owner.days.size > 1) {
            newDays = [d]
            break
          }
        }
      }
    }

    if (newDays.length === 0) return // No days can be reassigned (all 1-day bands)

    const nextId = Math.max(0, ...fasce.map(f => f.id)) + 1
    const newFascia = {
      id: nextId,
      days: new Set(newDays),
      entry: 8 * 60 + 30, // 08:30
      exit: 17 * 60 + 30, // 17:30
    }

    const updatedFasce = fasce.map(f => {
      const nextDays = new Set(f.days)
      newDays.forEach(d => nextDays.delete(d))
      return { ...f, days: nextDays }
    }).filter(f => f.days.size > 0)

    const nextFasce = [...updatedFasce, newFascia]
    setFasce(nextFasce)
    onChange(convertFasceToSchedule(nextFasce))
  }

  const handleRemoveFascia = (fasciaId) => {
    if (fasce.length <= 1) return // Rimozione unica fascia rimasta: ignorato
    const nextFasce = fasce.filter(f => f.id !== fasciaId)
    setFasce(nextFasce)
    onChange(convertFasceToSchedule(nextFasce))
  }

  // Calculate hours dynamically
  let weeklyH = '0.0'
  let monthlyH = '0.0'

  if (mode === 'work') {
    let weeklyMins = 0
    fasce.forEach(f => {
      weeklyMins += f.days.size * Math.max(0, f.exit - f.entry)
    })
    weeklyH = (weeklyMins / 60).toFixed(1)
    monthlyH = ((weeklyMins / 60) * 4.33).toFixed(1)
  } else {
    // Original calculation for study & gym
    const weeklyHours = DAYS.reduce((sum, d) => {
      const day = value[d.key]
      if (!day?.enabled) return sum

      let dayMins = 0

      if (mode === 'study') {
        if (day.morning?.enabled && day.morning.from && day.morning.to) {
          const [fh, fm] = day.morning.from.split(':').map(Number)
          const [th, tm] = day.morning.to.split(':').map(Number)
          dayMins += Math.max((th * 60 + tm) - (fh * 60 + fm), 0)
        }
        if (day.evening?.enabled && day.evening.from && day.evening.to) {
          const [fh, fm] = day.evening.from.split(':').map(Number)
          const [th, tm] = day.evening.to.split(':').map(Number)
          dayMins += Math.max((th * 60 + tm) - (fh * 60 + fm), 0)
        }
      } else {
        if (day.from && day.to) {
          const [fh, fm] = day.from.split(':').map(Number)
          const [th, tm] = day.to.split(':').map(Number)
          dayMins = Math.max((th * 60 + tm) - (fh * 60 + fm), 0)
        }
      }

      return sum + dayMins
    }, 0)
    
    weeklyH = (weeklyHours / 60).toFixed(1)
    monthlyH = ((weeklyHours / 60) * (52 / 12)).toFixed(1)
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center justify-between text-xs text-[var(--text-muted)] bg-[var(--bg-elevated)] px-4 py-2.5 rounded-xl border border-[var(--border-subtle)]">
        <span>
          {mode === 'work'
            ? 'Configura le fasce orarie e trascina le manopole'
            : 'Attiva i giorni e imposta entrata/uscita'}
        </span>
        <span className="font-bold text-[var(--text-primary)]">
          {weeklyH}h/sett · {monthlyH}h/mese
        </span>
      </div>

      {mode === 'work' ? (
        /* Work Bands: Dynamic Bands View */
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {fasce.map((fascia, idx) => {
              const canDelete = fasce.length > 1
              const activeDaysCount = fascia.days.size
              const diffMins = fascia.exit - fascia.entry
              const fasciaHours = ((activeDaysCount * diffMins) / 60).toFixed(1)

              return (
                <div
                  key={fascia.id}
                  className="p-4 sm:p-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] hover:border-[var(--border-default)] transition-all duration-300 space-y-4 text-left relative"
                >
                  {/* Top Header Row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-[var(--color-primary)] bg-[var(--color-primary-ghost)] px-2 py-0.5 rounded-md">
                        Fascia {idx + 1}
                      </span>
                      <span className="text-[10px] font-bold text-[var(--text-secondary)]">
                        {fasciaHours}h / sett
                      </span>
                    </div>

                    {canDelete && (
                      <button
                        onClick={() => handleRemoveFascia(fascia.id)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 transition-colors"
                        title="Rimuovi fascia"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  {/* Days Selector Row */}
                  <div className="flex flex-wrap gap-1.5 justify-start">
                    {WEEKDAYS.map((day) => {
                      const isSelected = fascia.days.has(day.key)
                      const ownerFascia = fasce.find(f => f.id !== fascia.id && f.days.has(day.key))
                      const isLocked = ownerFascia && ownerFascia.days.size === 1
                      const isAssignedElsewhere = ownerFascia && !isLocked

                      return (
                        <button
                          key={day.key}
                          onClick={() => handleDayClick(fascia.id, day.key)}
                          className={clsx(
                            "h-8 px-3 rounded-full text-xs font-bold transition-all flex items-center gap-1 select-none border",
                            isSelected
                              ? "bg-[var(--color-primary)] border-[var(--color-primary)] text-white shadow-sm"
                              : isLocked
                              ? "bg-transparent border-dashed border-[var(--border-subtle)] text-[var(--text-muted)] opacity-40 cursor-not-allowed"
                              : isAssignedElsewhere
                              ? "bg-[var(--bg-base)] border-[var(--border-subtle)] text-[var(--text-secondary)] opacity-60 hover:opacity-100"
                              : "bg-[var(--bg-base)] border-[var(--border-subtle)] text-[var(--text-primary)] hover:border-[var(--text-muted)]"
                          )}
                          title={
                            isLocked
                              ? "Unico giorno rimasto in un'altra fascia (bloccato)"
                              : isAssignedElsewhere
                              ? `Assegnato a Fascia ${fasce.indexOf(ownerFascia) + 1}`
                              : `Seleziona ${day.label}`
                          }
                          disabled={isLocked}
                        >
                          {day.label}
                          {isLocked && <span className="text-[10px]">🔒</span>}
                        </button>
                      )
                    })}
                  </div>

                  {/* Knobs Row */}
                  <div className="flex items-center justify-around gap-2 pt-2 bg-[var(--bg-surface)] rounded-xl p-3 border border-[var(--border-subtle)]/50">
                    <ArcKnob
                      label="DALLE"
                      value={fascia.entry}
                      onChange={(newEntry) => {
                        const entryVal = Math.min(newEntry, fascia.exit - 15)
                        updateFascia(fascia.id, { entry: entryVal })
                      }}
                    />

                    <div className="h-10 w-[1px] bg-[var(--border-subtle)] shrink-0 hidden sm:block" />

                    <ArcKnob
                      label="ALLE"
                      value={fascia.exit}
                      onChange={(newExit) => {
                        const exitVal = Math.max(newExit, fascia.entry + 15)
                        updateFascia(fascia.id, { exit: exitVal })
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Add Fascia Button */}
          {/* Only render if we can actually add a fascia (meaning there is at least one fascia with size > 1) */}
          {fasce.some(f => f.days.size > 1) && (
            <button
              onClick={handleAddFascia}
              className="w-full py-4 border-2 border-dashed border-[var(--border-subtle)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-ghost)] rounded-2xl flex items-center justify-center gap-2 text-sm font-black text-[var(--text-secondary)] hover:text-[var(--color-primary)] transition-all duration-300"
            >
              <Plus size={16} />
              Aggiungi fascia oraria
            </button>
          )}
        </div>
      ) : (
        /* Traditional Day Grid (Study / Gym) */
        <div className="flex gap-2 overflow-x-auto pb-2
          [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden
          snap-x snap-mandatory
          md:grid md:grid-cols-7 md:overflow-visible md:pb-0 md:snap-none">
          {DAYS.map((d) => {
            const day = value[d.key] || { enabled: false }
            return (
              <DayCard
                key={d.key}
                dayKey={d.key}
                label={d.label}
                day={day}
                accent={accent}
                mode={mode}
                onUpdate={(updates) => updateDay(d.key, updates)}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

function DayCard({ dayKey, label, day, accent, mode, onUpdate }) {
  return (
    <div
      className={clsx(
        'snap-start shrink-0 w-[calc((100vw-var(--page-padding)*2-32px)/4.5)] md:w-auto md:shrink',
        'rounded-[var(--radius-md)] border p-2 transition-all duration-200 text-center',
        'flex flex-col gap-1.5 min-h-[100px]',
        day.enabled
          ? 'border-[var(--border-default)]'
          : 'border-[var(--border-subtle)] opacity-60'
      )}
      style={day.enabled ? { backgroundColor: accent.bg, borderColor: accent.border } : undefined}
    >
      {/* Day label + toggle */}
      <div className="flex flex-col items-center gap-1">
        <span className={clsx('text-xs font-semibold', day.enabled ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]')}>
          {label}
        </span>
        <Toggle
          size="sm"
          checked={!!day.enabled}
          onChange={(v) => onUpdate({ enabled: v })}
        />
      </div>

      {day.enabled ? (
        <>
          {mode === 'study' ? (
            <StudyTimeInputs day={day} accent={accent} onUpdate={onUpdate} />
          ) : mode === 'gym' ? (
            <GymTimeInputs day={day} onUpdate={onUpdate} />
          ) : (
            <WorkTimeInputs day={day} onUpdate={onUpdate} />
          )}
        </>
      ) : (
        <span className="text-[10px] text-[var(--text-muted)] mt-auto">off</span>
      )}
    </div>
  )
}

function TimeInput({ label, value = '', onChange }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-[9px] uppercase tracking-wide text-[var(--text-muted)]">{label}</span>
      <input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full text-center text-[10px] font-medium bg-transparent border border-[var(--border-subtle)] rounded px-0.5 py-0.5 focus:outline-none focus:border-[var(--color-primary)]"
      />
    </div>
  )
}

function WorkTimeInputs({ day, onUpdate }) {
  return (
    <div className="flex flex-col gap-1">
      <TimeInput label="Dalle" value={day.from || ''} onChange={(v) => onUpdate({ from: v })} />
      <TimeInput label="Alle"  value={day.to   || ''} onChange={(v) => onUpdate({ to: v })} />
    </div>
  )
}

function StudyTimeInputs({ day, onUpdate }) {
  const morning = day.morning || {}
  const evening = day.evening || {}
  return (
    <div className="flex flex-col gap-1 text-left">
      <div className="flex items-center gap-1">
        <Toggle size="sm" checked={!!morning.enabled} onChange={(v) => onUpdate({ morning: { ...morning, enabled: v } })} />
        <span className="text-[9px] text-[var(--text-muted)]">Mat</span>
      </div>
      {morning.enabled && (
        <div className="flex flex-col gap-1">
          <TimeInput label="Da" value={morning.from || ''} onChange={(v) => onUpdate({ morning: { ...morning, from: v } })} />
          <TimeInput label="A"  value={morning.to   || ''} onChange={(v) => onUpdate({ morning: { ...morning, to: v } })} />
        </div>
      )}
      <div className="flex items-center gap-1">
        <Toggle size="sm" checked={!!evening.enabled} onChange={(v) => onUpdate({ evening: { ...evening, enabled: v } })} />
        <span className="text-[9px] text-[var(--text-muted)]">Ser</span>
      </div>
      {evening.enabled && (
        <div className="flex flex-col gap-1">
          <TimeInput label="Da" value={evening.from || ''} onChange={(v) => onUpdate({ evening: { ...evening, from: v } })} />
          <TimeInput label="A"  value={evening.to   || ''} onChange={(v) => onUpdate({ evening: { ...evening, to: v } })} />
        </div>
      )}
    </div>
  )
}

function GymTimeInputs({ day, onUpdate }) {
  return (
    <div className="flex flex-col gap-1">
      <TimeInput label="Inizio" value={day.from || ''} onChange={(v) => onUpdate({ from: v })} />
      <TimeInput label="Fine"   value={day.to   || ''} onChange={(v) => onUpdate({ to: v })} />
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-[9px] uppercase tracking-wide text-[var(--text-muted)]">Buffer</span>
        <input
          type="number"
          min={0}
          max={120}
          value={day.buffer_min || 0}
          onChange={(e) => onUpdate({ buffer_min: +e.target.value })}
          className="w-full text-center text-[10px] font-medium bg-transparent border border-[var(--border-subtle)] rounded px-0.5 py-0.5 focus:outline-none focus:border-[var(--color-primary)]"
        />
      </div>
    </div>
  )
}

export default TimeBlockSelector
