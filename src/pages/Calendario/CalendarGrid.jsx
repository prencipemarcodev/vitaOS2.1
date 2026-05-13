import { useMemo } from 'react'
import { 
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
  eachDayOfInterval, format, isSameMonth, isSameDay, isToday
} from 'date-fns'
import { it } from 'date-fns/locale'
import { isHoliday } from '@/lib/italianCalendar'
import clsx from 'clsx'

function CalendarGrid({ selectedMonth, events, absences, onDayClick }) {
  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(new Date(selectedMonth)), { weekStartsOn: 1 })
    const end = endOfWeek(endOfMonth(new Date(selectedMonth)), { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }, [selectedMonth])

  const weekDays = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom']

  return (
    <div className="flex flex-col h-full border border-[var(--border-subtle)] rounded-xl overflow-hidden bg-white shadow-sm">
      {/* Week header */}
      <div className="grid grid-cols-7 border-b border-[var(--border-subtle)] bg-[var(--bg-base)]">
        {weekDays.map(d => (
          <div key={d} className="py-2 text-[10px] uppercase font-bold text-[var(--text-muted)] text-center tracking-widest">
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 flex-1 min-h-0 divide-x divide-y divide-[var(--border-subtle)] border-l border-t border-transparent -ml-[1px] -mt-[1px]">
        {days.map((day) => {
          const holiday = isHoliday(day)
          const isCurrentMonth = isSameMonth(day, new Date(selectedMonth))
          const dayEvents = events.filter(e => isSameDay(new Date(e.date), day))
          const dayAbsence = absences.find(a => {
            const d = format(day, 'yyyy-MM-dd')
            return d >= a.start_date && d <= a.end_date
          })

          return (
            <div 
              key={day.toISOString()}
              onClick={() => onDayClick(day)}
              className={clsx(
                'min-h-[60px] p-1.5 cursor-pointer transition-colors relative group',
                !isCurrentMonth ? 'bg-[var(--bg-base)] opacity-40' : 'bg-white hover:bg-[var(--bg-elevated)]',
                isToday(day) && 'bg-[#3d997008]'
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={clsx(
                  'text-xs font-bold leading-none w-6 h-6 flex items-center justify-center rounded-full',
                  isToday(day) ? 'bg-[var(--color-primary)] text-white' : (holiday ? 'text-[var(--color-danger)]' : 'text-[var(--text-secondary)]')
                )}>
                  {format(day, 'd')}
                </span>
                {holiday && (
                  <span className="text-[9px] font-bold text-[var(--color-danger)] uppercase truncate ml-1 flex-1 text-right hidden sm:block">
                    {holiday}
                  </span>
                )}
              </div>

              {/* Day markers (events, absences) */}
              <div className="space-y-1">
                {dayAbsence && (
                  <div className={clsx(
                    'h-1.5 rounded-full w-full',
                    dayAbsence.type === 'ferie' ? 'bg-[#3d9970]' : 'bg-[#e05252]'
                  )} />
                )}
                <div className="flex flex-wrap gap-1">
                  {dayEvents.slice(0, 3).map((e, idx) => (
                    <div 
                      key={e.id} 
                      className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)]"
                    />
                  ))}
                  {dayEvents.length > 3 && (
                    <span className="text-[8px] font-bold text-[var(--text-muted)]">+{dayEvents.length - 3}</span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default CalendarGrid
