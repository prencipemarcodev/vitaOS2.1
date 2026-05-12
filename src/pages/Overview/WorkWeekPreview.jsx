import { useMemo } from 'react'
import Card from '@/components/ui/Card'
import { formatDuration } from '@/lib/formatters'
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isToday } from 'date-fns'
import { it } from 'date-fns/locale'
import clsx from 'clsx'

function WorkWeekPreview({ sessions, userConfig }) {
  const schedule = userConfig?.work_schedule || {}

  const weekData = useMemo(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 })
    const end = endOfWeek(new Date(), { weekStartsOn: 1 })
    const days = eachDayOfInterval({ start, end })

    return days.map((d) => {
      const key = format(d, 'yyyy-MM-dd')
      const dayOfWeek = d.getDay().toString()
      const dayConfig = schedule[dayOfWeek]
      const isWorkDay = dayConfig?.enabled

      // Ore lavorate quel giorno
      const daySessions = sessions.filter(s => s.date === key)
      const workedMinutes = daySessions.reduce((s, sess) => s + (sess.duration_minutes || 0), 0)

      // Ore previste
      let expectedMinutes = 0
      if (isWorkDay && dayConfig.from && dayConfig.to) {
        const [fh, fm] = dayConfig.from.split(':').map(Number)
        const [th, tm] = dayConfig.to.split(':').map(Number)
        expectedMinutes = (th * 60 + tm) - (fh * 60 + fm)
      }

      return {
        date: d,
        label: format(d, 'EEE', { locale: it }),
        dayNum: format(d, 'd'),
        isToday: isToday(d),
        isWorkDay,
        workedMinutes,
        expectedMinutes,
        percentage: expectedMinutes > 0 ? Math.min((workedMinutes / expectedMinutes) * 100, 100) : 0,
      }
    })
  }, [sessions, schedule])

  // Eventi palestra/corsa di questa settimana (placeholder per integrazione futura)
  const gymDays = useMemo(() => {
    const gymSchedule = userConfig?.gym_schedule || {}
    return Object.entries(gymSchedule)
      .filter(([, v]) => v?.enabled)
      .map(([key]) => parseInt(key))
  }, [userConfig])

  return (
    <Card padding="md" className="flex flex-col min-h-0">
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div>
          <p className="text-xs font-medium text-[var(--text-primary)]">Settimana lavorativa</p>
          <p className="text-[10px] text-[var(--text-muted)]">
            {format(weekData[0]?.date || new Date(), 'd MMM', { locale: it })} — {format(weekData[6]?.date || new Date(), 'd MMM', { locale: it })}
          </p>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)]">
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)]" /> Lavoro</span>
          {gymDays.length > 0 && (
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)]" /> Palestra</span>
          )}
        </div>
      </div>

      {/* Week grid */}
      <div className="grid grid-cols-7 gap-1 flex-1">
        {weekData.map((day) => (
          <div
            key={day.label}
            className={clsx(
              'flex flex-col items-center rounded-[var(--radius-md)] p-1.5 transition-colors',
              day.isToday && 'bg-[var(--color-primary-ghost)]',
              !day.isWorkDay && !day.isToday && 'opacity-40',
            )}
          >
            {/* Day label */}
            <span className={clsx(
              'text-[10px] font-medium uppercase',
              day.isToday ? 'text-[var(--color-primary)]' : 'text-[var(--text-muted)]'
            )}>
              {day.label.charAt(0)}
            </span>

            {/* Day number */}
            <span className={clsx(
              'w-7 h-7 flex items-center justify-center rounded-full text-xs font-semibold mt-0.5',
              day.isToday
                ? 'bg-[var(--color-primary)] text-white'
                : 'text-[var(--text-primary)]'
            )}>
              {day.dayNum}
            </span>

            {/* Progress bar */}
            {day.isWorkDay && (
              <div className="w-full mt-1">
                <div className="h-1 w-full bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${day.percentage}%`,
                      backgroundColor: day.percentage >= 100 ? 'var(--color-success)' : 'var(--color-primary)',
                    }}
                  />
                </div>
              </div>
            )}

            {/* Gym dot */}
            {gymDays.includes(day.date.getDay()) && (
              <span className="w-1 h-1 rounded-full bg-[var(--color-success)] mt-0.5" />
            )}
          </div>
        ))}
      </div>
    </Card>
  )
}

export default WorkWeekPreview
