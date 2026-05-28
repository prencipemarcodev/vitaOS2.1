import { useState, useEffect, useRef } from 'react'
import clsx from 'clsx'
import { Plus, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const WEEKDAYS = [
  { key: 0, label: 'Lun', short: 'L' },
  { key: 1, label: 'Mar', short: 'M' },
  { key: 2, label: 'Mer', short: 'M' },
  { key: 3, label: 'Gio', short: 'G' },
  { key: 4, label: 'Ven', short: 'V' },
  { key: 5, label: 'Sab', short: 'S' },
  { key: 6, label: 'Dom', short: 'D' },
]

// ─── 1. Bidirectional translation functions ───

// Work Translation Helpers
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
        days: new Set([0, 1, 2, 3, 4]),
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

function convertWorkFasceToSchedule(fasceList) {
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

// Gym Translation Helpers
function parseGymSchedule(value) {
  if (!value || Object.keys(value).length === 0) {
    return [
      {
        id: 1,
        days: new Set([0, 2, 4]), // Mon, Wed, Fri as default gym days
        entry: 18 * 60, // 18:00
        exit: 19 * 60 + 30, // 19:30
        buffer: 15 // 15 mins default
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
      const bufferVal = dayData.buffer_min || 0
      const key = `${dayData.from}-${dayData.to}-${bufferVal}`
      if (!groups[key]) {
        const [fh, fm] = dayData.from.split(':').map(Number)
        const [th, tm] = dayData.to.split(':').map(Number)
        groups[key] = {
          entry: fh * 60 + fm,
          exit: th * 60 + tm,
          buffer: bufferVal,
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
        days: new Set([0, 2, 4]),
        entry: 18 * 60,
        exit: 19 * 60 + 30,
        buffer: 15
      }
    ]
  }

  return Object.values(groups).map((group, index) => ({
    id: index + 1,
    days: new Set(group.days),
    entry: group.entry,
    exit: group.exit,
    buffer: group.buffer
  }))
}

function convertGymFasceToSchedule(fasceList) {
  const gymSchedule = {}
  const dayKeys = ['1', '2', '3', '4', '5', '6', '0']
  dayKeys.forEach(k => {
    gymSchedule[k] = { enabled: false }
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
      gymSchedule[dbKey] = {
        enabled: true,
        from: fromStr,
        to: toStr,
        buffer_min: f.buffer || 0
      }
    })
  })
  return gymSchedule
}

// Study Translation Helpers
function parseStudySchedule(value) {
  if (!value || Object.keys(value).length === 0) {
    return [
      {
        id: 1,
        days: new Set([0, 1, 2, 3, 4]), // Mon-Fri
        entry: 9 * 60, // 09:00
        exit: 12 * 60, // 12:00
        slot: 'morning'
      },
      {
        id: 2,
        days: new Set([0, 1, 2, 3, 4]), // Mon-Fri
        entry: 15 * 60, // 15:00
        exit: 18 * 60, // 18:00
        slot: 'evening'
      }
    ]
  }

  const groups = {}
  let hasEnabled = false

  for (let d = 0; d < 7; d++) {
    const dbKey = d === 6 ? '0' : String(d + 1)
    const dayData = value[dbKey]
    if (dayData?.enabled) {
      if (dayData.morning?.enabled && dayData.morning.from && dayData.morning.to) {
        hasEnabled = true
        const key = `${dayData.morning.from}-${dayData.morning.to}-morning`
        if (!groups[key]) {
          const [fh, fm] = dayData.morning.from.split(':').map(Number)
          const [th, tm] = dayData.morning.to.split(':').map(Number)
          groups[key] = {
            entry: fh * 60 + fm,
            exit: th * 60 + tm,
            slot: 'morning',
            days: []
          }
        }
        groups[key].days.push(d)
      }
      if (dayData.evening?.enabled && dayData.evening.from && dayData.evening.to) {
        hasEnabled = true
        const key = `${dayData.evening.from}-${dayData.evening.to}-evening`
        if (!groups[key]) {
          const [fh, fm] = dayData.evening.from.split(':').map(Number)
          const [th, tm] = dayData.evening.to.split(':').map(Number)
          groups[key] = {
            entry: fh * 60 + fm,
            exit: th * 60 + tm,
            slot: 'evening',
            days: []
          }
        }
        groups[key].days.push(d)
      }
    }
  }

  if (!hasEnabled) {
    return [
      {
        id: 1,
        days: new Set([0, 1, 2, 3, 4]),
        entry: 9 * 60,
        exit: 12 * 60,
        slot: 'morning'
      },
      {
        id: 2,
        days: new Set([0, 1, 2, 3, 4]),
        entry: 15 * 60,
        exit: 18 * 60,
        slot: 'evening'
      }
    ]
  }

  return Object.values(groups).map((group, index) => ({
    id: index + 1,
    days: new Set(group.days),
    entry: group.entry,
    exit: group.exit,
    slot: group.slot
  }))
}

function convertStudyFasceToSchedule(fasceList) {
  const studySchedule = {}
  const dayKeys = ['1', '2', '3', '4', '5', '6', '0']
  dayKeys.forEach(k => {
    studySchedule[k] = {
      enabled: false,
      morning: { enabled: false },
      evening: { enabled: false }
    }
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

      studySchedule[dbKey].enabled = true
      if (f.slot === 'morning') {
        studySchedule[dbKey].morning = {
          enabled: true,
          from: fromStr,
          to: toStr
        }
      } else {
        studySchedule[dbKey].evening = {
          enabled: true,
          from: fromStr,
          to: toStr
        }
      }
    })
  })
  return studySchedule
}

// ─── 2. General Parsing & Conversion Dispatchers ───
function parseSchedule(mode, val) {
  if (mode === 'work') return parseWorkSchedule(val)
  if (mode === 'study') return parseStudySchedule(val)
  return parseGymSchedule(val)
}

function convertFasceToSchedule(mode, fasceList) {
  if (mode === 'work') return convertWorkFasceToSchedule(fasceList)
  if (mode === 'study') return convertStudyFasceToSchedule(fasceList)
  return convertGymFasceToSchedule(fasceList)
}

/**
 * ArcKnob — Premium circular dial time selector.
 */
function ArcKnob({ value, onChange, label, disabled = false, accentColor = 'var(--color-primary)' }) {
  const svgRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)
  const [localValue, setLocalValue] = useState(value)

  // Keep local value in sync with prop when not dragging
  useEffect(() => {
    if (!isDragging) {
      setLocalValue(value)
    }
  }, [value, isDragging])

  // Convert minutes (0 - 1440) to angle (135 - 405)
  const currentAngle = 135 + (localValue / 1440) * 270

  // Format time (HH:MM)
  const hours = Math.floor(localValue / 60)
  const minutes = localValue % 60
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

      // Update local state instantly for 60fps visual rendering!
      setLocalValue(mins)
      // Call parent onChange
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
              stroke={accentColor}
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
            stroke={accentColor}
            strokeWidth="3.5"
            className={clsx(
              "shadow-sm transition-all duration-75",
              isDragging && "scale-110"
            )}
            style={{ 
              transformOrigin: `${thumbPos.x}px ${thumbPos.y}px`,
              fill: isDragging ? accentColor : 'var(--bg-surface)'
            }}
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
    work:  { bg: 'rgba(180,98,67,0.08)',  border: 'rgba(180,98,67,0.3)',  color: 'var(--color-primary)' },
    study: { bg: 'rgba(155,89,182,0.08)', border: 'rgba(155,89,182,0.3)', color: '#9b59b6' },
    gym:   { bg: 'rgba(61,153,112,0.08)', border: 'rgba(61,153,112,0.3)', color: '#3d9970' },
  }
  const accent = accentMap[mode]

  // Dynamic schedules local state
  const [fasce, setFasce] = useState(() => parseSchedule(mode, value))

  // Synchronize when value changes from outside (e.g., store resets)
  useEffect(() => {
    const currentConverted = convertFasceToSchedule(mode, fasce)
    if (JSON.stringify(value) !== JSON.stringify(currentConverted)) {
      setFasce(parseSchedule(mode, value))
    }
  }, [value, mode])

  const updateFascia = (id, updates) => {
    setFasce(prev => {
      const next = prev.map(f => (f.id === id ? { ...f, ...updates } : f))
      onChange(convertFasceToSchedule(mode, next))
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
      // Find other owner of same day
      // For study: only conflict if other fascia has the SAME slot
      // For work/gym: conflict with any other fascia
      const otherFascia = fasce.find(f => {
        if (f.id === fasciaId) return false
        const hasDay = f.days.has(dayIdx)
        if (mode === 'study') {
          return hasDay && f.slot === targetFascia.slot
        }
        return hasDay
      })

      if (otherFascia && otherFascia.days.size === 1) {
        // Removing would leave other fascia with 0 days: ignored
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
    onChange(convertFasceToSchedule(mode, nextFasce))
  }

  const handleAddFascia = () => {
    const defaultSlot = mode === 'study' ? 'morning' : undefined
    const defaultBuffer = mode === 'gym' ? 15 : undefined

    const assignedDays = new Set()
    fasce.forEach(f => {
      if (mode === 'study' && f.slot !== defaultSlot) return
      f.days.forEach(d => assignedDays.add(d))
    })

    let newDays = [0, 1, 2, 3, 4, 5, 6].filter(d => !assignedDays.has(d))

    if (newDays.length === 0) {
      const candidates = [5, 6]
      const allowedCandidates = []
      candidates.forEach(c => {
        const owner = fasce.find(f => {
          if (mode === 'study' && f.slot !== defaultSlot) return false
          return f.days.has(c)
        })
        if (owner && owner.days.size > 1) {
          allowedCandidates.push(c)
        }
      })

      if (allowedCandidates.length > 0) {
        newDays = allowedCandidates
      } else {
        for (let d = 0; d < 7; d++) {
          const owner = fasce.find(f => {
            if (mode === 'study' && f.slot !== defaultSlot) return false
            return f.days.has(d)
          })
          if (owner && owner.days.size > 1) {
            newDays = [d]
            break
          }
        }
      }
    }

    if (newDays.length === 0) return

    const nextId = Math.max(0, ...fasce.map(f => f.id)) + 1
    const newFascia = {
      id: nextId,
      days: new Set(newDays),
      entry: 8 * 60 + 30, // 08:30
      exit: 17 * 60 + 30, // 17:30
      ...(mode === 'study' && { slot: defaultSlot }),
      ...(mode === 'gym' && { buffer: defaultBuffer })
    }

    const updatedFasce = fasce.map(f => {
      if (mode === 'study' && f.slot !== defaultSlot) return f
      const nextDays = new Set(f.days)
      newDays.forEach(d => nextDays.delete(d))
      return { ...f, days: nextDays }
    }).filter(f => f.days.size > 0)

    const nextFasce = [...updatedFasce, newFascia]
    setFasce(nextFasce)
    onChange(convertFasceToSchedule(mode, nextFasce))
  }

  const handleRemoveFascia = (fasciaId) => {
    if (fasce.length <= 1) return
    const nextFasce = fasce.filter(f => f.id !== fasciaId)
    setFasce(nextFasce)
    onChange(convertFasceToSchedule(mode, nextFasce))
  }

  // Calculate hours dynamically
  let weeklyH = '0.0'
  let monthlyH = '0.0'

  if (mode === 'study') {
    let weeklyMins = 0
    fasce.forEach(f => {
      weeklyMins += f.days.size * Math.max(0, f.exit - f.entry)
    })
    weeklyH = (weeklyMins / 60).toFixed(1)
    monthlyH = ((weeklyMins / 60) * 4.33).toFixed(1)
  } else if (mode === 'gym') {
    let weeklyMins = 0
    fasce.forEach(f => {
      weeklyMins += f.days.size * Math.max(0, f.exit - f.entry)
    })
    weeklyH = (weeklyMins / 60).toFixed(1)
    monthlyH = ((weeklyMins / 60) * 4.33).toFixed(1)
  } else {
    // Work Mode
    let weeklyMins = 0
    fasce.forEach(f => {
      weeklyMins += f.days.size * Math.max(0, f.exit - f.entry)
    })
    weeklyH = (weeklyMins / 60).toFixed(1)
    monthlyH = ((weeklyMins / 60) * 4.33).toFixed(1)
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center justify-between text-xs text-[var(--text-muted)] bg-[var(--bg-elevated)] px-4 py-2.5 rounded-xl border border-[var(--border-subtle)]">
        <span>
          {mode === 'work' ? 'Configura le fasce orarie e trascina le manopole' :
           mode === 'study' ? 'Configura le fasce orarie per lo studio e trascina le manopole' :
           'Configura le fasce orarie per la palestra e trascina le manopole'}
        </span>
        <span className="font-bold text-[var(--text-primary)]">
          {weeklyH}h/sett · {monthlyH}h/mese
        </span>
      </div>

      {/* Dynamic Bands View (Shared for all 3 modes!) */}
      <div className="space-y-2">
        <div className="flex gap-4 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory scrollbar-thin">
          <AnimatePresence initial={false}>
            {fasce.map((fascia, idx) => {
              const canDelete = fasce.length > 1
              const activeDaysCount = fascia.days.size
              const diffMins = fascia.exit - fascia.entry
              const fasciaHours = ((activeDaysCount * diffMins) / 60).toFixed(1)

              return (
                <motion.div
                  key={fascia.id}
                  initial={{ opacity: 0, x: 50, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -50, scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                  className="p-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] hover:border-[var(--border-default)] transition-all duration-300 space-y-4 text-left relative shrink-0 snap-start w-[185px] sm:w-[205px] flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    {/* Top Header Row */}
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex flex-wrap items-center gap-1">
                        <span 
                          className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded text-white"
                          style={{ backgroundColor: accent.color }}
                        >
                          F. {idx + 1}
                        </span>
                        
                        {mode === 'study' && (
                          <button
                            onClick={() => updateFascia(fascia.id, { slot: fascia.slot === 'morning' ? 'evening' : 'morning' })}
                            className={clsx(
                              "text-[8px] font-black uppercase tracking-wider px-1 py-0.5 rounded transition-colors border",
                              fascia.slot === 'morning'
                                ? "bg-amber-100/80 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30"
                                : "bg-indigo-100/80 text-indigo-700 border-indigo-200 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/30"
                            )}
                            title="Inverti mattina/sera"
                          >
                            {fascia.slot === 'morning' ? '🌅 M' : '🌃 S'}
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[10px] font-bold text-[var(--text-secondary)]">
                          {fasciaHours}h
                        </span>
                        {canDelete && (
                          <button
                            onClick={() => handleRemoveFascia(fascia.id)}
                            className="w-6 h-6 rounded-md flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 transition-colors"
                            title="Rimuovi fascia"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Days Selector Row (Wrapping beautifully in 2 rows) */}
                    <div className="flex flex-wrap gap-1 justify-start">
                      {WEEKDAYS.map((day) => {
                        const isSelected = fascia.days.has(day.key)
                        
                        const ownerFascia = fasce.find(f => {
                          if (f.id === fascia.id) return false
                          const hasDay = f.days.has(day.key)
                          if (mode === 'study') {
                            return hasDay && f.slot === fascia.slot
                          }
                          return hasDay
                        })
                        const isLocked = ownerFascia && ownerFascia.days.size === 1
                        const isAssignedElsewhere = ownerFascia && !isLocked

                        return (
                          <button
                            key={day.key}
                            onClick={() => handleDayClick(fascia.id, day.key)}
                            className={clsx(
                              "h-6 px-1.5 min-w-[23px] rounded text-[9px] font-black transition-all flex items-center justify-center select-none border",
                              isSelected
                                ? "text-white shadow-sm"
                                : isLocked
                                ? "bg-transparent border-dashed border-[var(--border-subtle)] text-[var(--text-muted)] opacity-40 cursor-not-allowed"
                                : isAssignedElsewhere
                                ? "bg-[var(--bg-base)] border-[var(--border-subtle)] text-[var(--text-secondary)] opacity-60 hover:opacity-100"
                                : "bg-[var(--bg-base)] border-[var(--border-subtle)] text-[var(--text-primary)] hover:border-[var(--text-muted)]"
                            )}
                            style={isSelected ? { backgroundColor: accent.color, borderColor: accent.color } : undefined}
                            title={
                              isLocked
                                ? "Unico giorno rimasto in un'altra fascia"
                                : isAssignedElsewhere
                                ? `Assegnato a Fascia ${fasce.indexOf(ownerFascia) + 1}`
                                : `Seleziona ${day.label}`
                            }
                            disabled={isLocked}
                          >
                            {day.short}
                          </button>
                        )
                      })}
                    </div>

                    {/* Knobs Column (Stacked Vertically to save horizontal space!) */}
                    <div className="flex flex-col items-center gap-3 bg-[var(--bg-surface)] rounded-xl p-3 border border-[var(--border-subtle)]/50">
                      <ArcKnob
                        label={mode === 'work' ? 'DALLE' : mode === 'study' ? 'DALLE' : 'INIZIO'}
                        value={fascia.entry}
                        accentColor={accent.color}
                        onChange={(newEntry) => {
                          const entryVal = Math.min(newEntry, fascia.exit - 15)
                          updateFascia(fascia.id, { entry: entryVal })
                        }}
                      />

                      <div className="w-10 h-[1px] bg-[var(--border-subtle)] shrink-0" />

                      <ArcKnob
                        label={mode === 'work' ? 'ALLE' : mode === 'study' ? 'ALLE' : 'FINE'}
                        value={fascia.exit}
                        accentColor={accent.color}
                        onChange={(newExit) => {
                          const exitVal = Math.max(newExit, fascia.entry + 15)
                          updateFascia(fascia.id, { exit: exitVal })
                        }}
                      />
                    </div>
                  </div>

                  {/* Gym Buffer Input placed elegantly at the bottom */}
                  {mode === 'gym' && (
                    <div className="flex items-center justify-between w-full bg-[var(--bg-base)] px-2.5 py-1.5 rounded-xl border border-[var(--border-subtle)] mt-2">
                      <span className="text-[8px] font-black text-[var(--text-secondary)] uppercase tracking-wider">Buffer:</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min={0}
                          max={120}
                          step={5}
                          value={fascia.buffer || 0}
                          onChange={(e) => updateFascia(fascia.id, { buffer: parseInt(e.target.value) || 0 })}
                          className="w-10 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded text-center text-xs font-black text-[var(--text-primary)] focus:outline-none"
                        />
                        <span className="text-[9px] font-black text-[var(--text-muted)]">m</span>
                      </div>
                    </div>
                  )}
                </motion.div>
              )
            })}
          </AnimatePresence>

          {/* Inline dashed card to Add a new Fascia */}
          {(() => {
            const defaultSlot = mode === 'study' ? 'morning' : undefined
            const canAdd = fasce.some(f => {
              if (mode === 'study' && f.slot !== defaultSlot) return false
              return f.days.size > 1
            }) || (mode === 'study' && fasce.some(f => f.slot === 'evening' && f.days.size > 1))
            
            if (!canAdd) return null

            return (
              <button
                onClick={handleAddFascia}
                className="snap-start shrink-0 w-[110px] sm:w-[130px] rounded-2xl border-2 border-dashed border-[var(--border-subtle)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-ghost)] flex flex-col items-center justify-center gap-2 text-xs font-black text-[var(--text-secondary)] hover:text-[var(--color-primary)] transition-all duration-300 self-stretch"
                style={{ hoverColor: accent.color }}
              >
                <Plus size={22} className="opacity-60" />
                <span className="text-[10px] leading-tight text-center">Aggiungi<br/>Fascia</span>
              </button>
            )
          })()}
        </div>
      </div>
    </div>
  )
}

export default TimeBlockSelector
