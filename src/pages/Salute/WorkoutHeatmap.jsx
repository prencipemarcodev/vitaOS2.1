import { useMemo } from 'react'
import Card from '@/components/ui/Card'
import { eachDayOfInterval, subDays, format, isSameDay } from 'date-fns'
import { it } from 'date-fns/locale'
import clsx from 'clsx'

function WorkoutHeatmap({ sessions }) {
  const days = useMemo(() => {
    const end = new Date()
    const start = subDays(end, 364) // Last 365 days
    return eachDayOfInterval({ start, end })
  }, [])

  return (
    <Card padding="md" className="overflow-hidden">
      <h3 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-4">Attività Annuale</h3>
      
      <div className="flex flex-wrap gap-1">
        {days.map((day) => {
          const daySessions = sessions.filter(s => isSameDay(new Date(s.date), day))
          const count = daySessions.length
          const totalDuration = daySessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0)
          
          let colorClass = 'bg-[var(--bg-base)]'
          if (count === 1) {
            colorClass = 'bg-[var(--color-primary)] opacity-45'
          } else if (count >= 2) {
            colorClass = 'bg-[var(--color-primary)]'
          }

          const tooltip = count > 0 
            ? `${format(day, 'dd MMMM yyyy', { locale: it })} • ${count} ${count === 1 ? 'allenamento' : 'allenamenti'}${totalDuration > 0 ? ` (${totalDuration} min)` : ''}`
            : format(day, 'dd MMMM yyyy', { locale: it })

          return (
            <div 
              key={day.toISOString()}
              className={clsx(
                'w-2 h-2 rounded-[2px] transition-colors',
                colorClass
              )}
              title={tooltip}
            />
          )
        })}
      </div>
      
      <div className="mt-4 flex items-center justify-end gap-2 text-[8px] font-bold text-[var(--text-muted)] uppercase">
        <span>Meno</span>
        <div className="flex gap-1">
          <div className="w-2 h-2 rounded-[2px] bg-[var(--bg-base)]" />
          <div className="w-2 h-2 rounded-[2px] bg-[var(--color-primary)] opacity-40" />
          <div className="w-2 h-2 rounded-[2px] bg-[var(--color-primary)]" />
        </div>
        <span>Più</span>
      </div>
    </Card>
  )
}

export default WorkoutHeatmap
