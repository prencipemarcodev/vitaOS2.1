import { useMemo } from 'react'
import { 
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
  eachDayOfInterval, format, isSameMonth, isSameDay, isToday
} from 'date-fns'
import { it } from 'date-fns/locale'
import { isHoliday } from '@/lib/italianCalendar'
import clsx from 'clsx'
import { useAppStore } from '@/store/useAppStore'

function CalendarGrid({ selectedMonth, events, absences, recurringEvents = [], subscriptions = [], onDayClick }) {
  const { userConfig } = useAppStore()
  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(new Date(selectedMonth)), { weekStartsOn: 1 })
    const end = endOfWeek(endOfMonth(new Date(selectedMonth)), { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }, [selectedMonth])

  const getProgram = (day) => {
    if (!userConfig) return []
    const dayIdx = day.getDay().toString()
    const p = []
    
    const work = userConfig.work_schedule?.[dayIdx]
    if (work?.enabled) p.push({ label: 'Lavoro', time: work.from, color: '#B46243' })
    
    const study = userConfig.study_schedule?.[dayIdx]
    if (study?.enabled) p.push({ label: 'Studio', time: study.from, color: '#4a90d9' })
    
    const gym = userConfig.gym_schedule?.[dayIdx]
    if (gym?.enabled) p.push({ label: 'Palestra', time: gym.from, color: '#3d9970' })
    
    return p
  }

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
          const daySubs = subscriptions.filter(sub => {
            if (!sub.is_active || !sub.next_renewal_date) return false
            return isSameDay(new Date(sub.next_renewal_date), day)
          })

          return (
            <div 
              key={day.toISOString()}
              onClick={() => onDayClick(day)}
              className={clsx(
                'min-h-[72px] sm:min-h-[100px] p-1 sm:p-1.5 cursor-pointer transition-colors relative group',
                !isCurrentMonth ? 'bg-[var(--bg-base)] opacity-40' : 'bg-white hover:bg-[var(--bg-elevated)]',
                isToday(day) && 'bg-[var(--color-primary-ghost)]'
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={clsx(
                   'text-[10px] sm:text-xs font-black leading-none w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full',
                   isToday(day) ? 'bg-[var(--color-primary)] text-white shadow-sm' : (holiday ? 'text-[var(--color-danger)]' : 'text-[var(--text-secondary)]')
                )}>
                  {format(day, 'd')}
                </span>
                {holiday && (
                  <span className="text-[7px] sm:text-[9px] font-bold text-[var(--color-danger)] uppercase truncate ml-1 flex-1 text-right">
                    {holiday}
                  </span>
                )}
              </div>

              {/* Event Labels & Markers */}
              <div className="flex flex-col gap-0.5 overflow-hidden">
                {/* 1. Assenze (Ferie/Malattia) - Badge largo */}
                {dayAbsence && (
                  <div className={clsx(
                    'px-1 py-0.5 rounded-md text-[7px] font-black uppercase truncate leading-none mb-0.5',
                    dayAbsence.type === 'ferie' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  )}>
                    {dayAbsence.type === 'ferie' ? 'Ferie' : 'Malattia'}
                  </div>
                )}

                {/* 2. Programma (Lavoro/Studio/Gym) */}
                {getProgram(day).map((p, i) => (
                  <div 
                    key={i} 
                    className="px-1 py-0.5 rounded-md text-[7px] font-black uppercase truncate leading-none"
                    style={{ backgroundColor: `${p.color}15`, color: p.color }}
                  >
                    {p.label}
                  </div>
                ))}

                {/* 3. Ricorrenze Annuali (Compleanni/Anniversari) */}
                {recurringEvents.filter(re => {
                  return day.getDate() === re.day && (day.getMonth() + 1) === re.month
                }).map((re, i) => (
                  <div 
                    key={`re-${i}`} 
                    className="px-1 py-0.5 bg-purple-100 text-purple-700 rounded-md text-[7px] font-black uppercase truncate leading-none"
                  >
                    🎂 {re.title}
                  </div>
                ))}

                {/* 4. Eventi Custom */}
                {dayEvents.slice(0, 1).map((e) => (
                  <div 
                    key={e.id} 
                    className="px-1 py-0.5 bg-blue-100 text-blue-700 rounded-md text-[7px] font-black uppercase truncate leading-none"
                  >
                    {e.title}
                  </div>
                ))}

                {/* 5. Abbonamenti da pagare */}
                {daySubs.map((sub) => (
                  <div 
                    key={sub.id} 
                    className="px-1 py-0.5 bg-orange-100 text-orange-700 rounded-md text-[7px] font-black uppercase truncate leading-none"
                    title={`Rinnovo ${sub.name}: €${parseFloat(sub.amount).toFixed(2)}`}
                  >
                    💳 {sub.name} (€{parseFloat(sub.amount).toFixed(0)})
                  </div>
                ))}

                {/* 6. Indicatore "Ancora altri" */}
                {(dayEvents.length > 1) && (
                  <div className="flex items-center gap-1 pl-1">
                    <div className="w-1 h-1 rounded-full bg-gray-400" />
                    <span className="text-[6px] font-bold text-gray-500">+{dayEvents.length - 1}</span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default CalendarGrid
