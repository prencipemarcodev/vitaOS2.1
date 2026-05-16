import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { format, isToday, isTomorrow } from 'date-fns'
import { it } from 'date-fns/locale'

function UpcomingEvents({ events = [] }) {
  const top5 = events.slice(0, 5)

  const formatWhen = (dateStr) => {
    const d = new Date(dateStr)
    if (isToday(d)) return 'Oggi'
    if (isTomorrow(d)) return 'Domani'
    return format(d, 'EEE d MMM', { locale: it })
  }

  return (
    <Card padding="md" className="min-h-0 flex flex-col">
      <p className="text-xs font-medium text-[var(--text-primary)] mb-2 shrink-0">Prossimi eventi</p>

      {top5.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-[var(--text-muted)]">
          <p className="text-xs">Nessun evento in programma</p>
        </div>
      ) : (
        <div className="space-y-1.5 overflow-y-auto flex-1">
          {top5.map((ev) => (
            <div
              key={ev.id}
              className="flex items-center gap-2.5 p-2 rounded-[var(--radius-sm)] hover:bg-[var(--bg-elevated)] transition-colors"
            >
              <div
                className="w-1 h-8 rounded-full shrink-0"
                style={{ backgroundColor: `var(--event-${ev.category || 'altro'})` }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-[var(--text-primary)] truncate">{ev.title}</p>
                <p className="text-[10px] text-[var(--text-muted)]">
                  {formatWhen(ev.date)}
                  {ev.start_time && ` · ${ev.start_time.slice(0, 5)}`}
                </p>
              </div>
              <Badge category={ev.category} size="sm" className="capitalize">
                {ev.category || 'Evento'}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

export default UpcomingEvents
