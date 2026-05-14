import clsx from 'clsx'
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

/**
 * TimeBlockSelector — card-grid visiva per configurare orari settimanali.
 * @param {'work'|'study'|'gym'} mode
 * @param {object} value   — JSONB dal DB (es. { "1": { enabled, from, to }, ... })
 * @param {function} onChange
 */
function TimeBlockSelector({ mode = 'work', value = {}, onChange }) {
  const accentMap = {
    work:  { bg: 'rgba(180,98,67,0.08)',  border: 'rgba(180,98,67,0.3)',  dot: 'var(--color-primary)' },
    study: { bg: 'rgba(155,89,182,0.08)', border: 'rgba(155,89,182,0.3)', dot: '#9b59b6' },
    gym:   { bg: 'rgba(61,153,112,0.08)', border: 'rgba(61,153,112,0.3)', dot: '#3d9970' },
  }
  const accent = accentMap[mode]

  const updateDay = (dayKey, updates) => {
    onChange({ ...value, [dayKey]: { ...value[dayKey], ...updates } })
  }

  // Calcola monte ore settimanale
  const weeklyHours = DAYS.reduce((sum, d) => {
    const day = value[d.key]
    if (!day?.enabled) return sum

    let dayMins = 0

    if (mode === 'study') {
      // Somma mattina + sera
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
      // Logica standard (Work/Gym)
      if (day.from && day.to) {
        const [fh, fm] = day.from.split(':').map(Number)
        const [th, tm] = day.to.split(':').map(Number)
        dayMins = Math.max((th * 60 + tm) - (fh * 60 + fm), 0)
      }
    }

    return sum + dayMins
  }, 0)
  
  const weeklyH = (weeklyHours / 60).toFixed(1)
  const monthlyH = ((weeklyHours / 60) * (52 / 12)).toFixed(1)

  return (
    <div className="space-y-3">
      {/* Summary */}
      <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
        <span>Attiva i giorni e imposta entrata/uscita</span>
        <span className="font-semibold text-[var(--text-primary)]">
          {weeklyH}h/sett · {monthlyH}h/mese
        </span>
      </div>

      {/* Mobile: scroll orizzontale; Desktop: grid 7 colonne */}
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
