import { useMemo } from 'react'
import Card from '@/components/ui/Card'
import { eachDayOfInterval, subDays, format, isSameDay } from 'date-fns'
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
          const hasWorkout = sessions.some(s => isSameDay(new Date(s.date), day))
          return (
            <div 
              key={day.toISOString()}
              className={clsx(
                'w-2 h-2 rounded-[2px] transition-colors',
                hasWorkout ? 'bg-[var(--color-primary)]' : 'bg-[var(--bg-base)]'
              )}
              title={format(day, 'dd MMMM yyyy')}
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
