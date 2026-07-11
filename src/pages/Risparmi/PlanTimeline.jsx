import { useMemo } from 'react'
import { format, parseISO, startOfMonth, addMonths, differenceInMonths } from 'date-fns'
import { it } from 'date-fns/locale'
import clsx from 'clsx'

export default function PlanTimeline({ plans = [], advice = null }) {
  // Filtra piani a obiettivo attivi e con data scadenza
  const goalsWithDate = useMemo(() => {
    return plans.filter(p => p.type === 'goal' && p.is_active !== false && p.target_date)
  }, [plans])

  const { timelineMonths, todayPosition, points } = useMemo(() => {
    const today = new Date()
    const start = startOfMonth(today)
    
    // Trova la data di scadenza più lontana
    let end = startOfMonth(addMonths(today, 6))
    if (goalsWithDate.length > 0) {
      const dates = goalsWithDate.map(g => parseISO(g.target_date).getTime())
      const maxDate = new Date(Math.max(...dates))
      end = startOfMonth(addMonths(maxDate, 1))
    }

    const totalMonths = Math.max(2, differenceInMonths(end, start))
    
    // Genera i mesi per l'asse delle X
    const timelineMonths = []
    for (let i = 0; i <= totalMonths; i++) {
      const d = addMonths(start, i)
      timelineMonths.push({
        date: d,
        label: format(d, 'MMM', { locale: it })
      })
    }

    // Calcolo posizionamento oggi
    const totalTime = end.getTime() - start.getTime()
    const todayTime = today.getTime() - start.getTime()
    const todayPosition = Math.max(0, Math.min(100, (todayTime / totalTime) * 100))

    // Calcolo punti obiettivi
    const points = goalsWithDate.map((plan, index) => {
      const targetDate = parseISO(plan.target_date)
      const goalTime = targetDate.getTime() - start.getTime()
      const position = Math.max(0, Math.min(100, (goalTime / totalTime) * 100))

      const isCompleted = plan.current_amount >= plan.target_amount
      const forecast = advice?.forecasts?.find(f => f.planId === plan.id)
      const isAtRisk = forecast ? forecast.isAtRisk : false

      // Per evitare sovrapposizioni verticali semplici, alterniamo l'offset superiore dei tag
      const verticalOffset = index % 2 === 0 ? 'top-[-8px]' : 'top-[-26px]'

      return {
        id: plan.id,
        name: plan.name,
        targetAmount: plan.target_amount,
        position,
        isCompleted,
        isAtRisk,
        verticalOffset
      }
    })

    return {
      timelineMonths,
      todayPosition,
      points
    }
  }, [goalsWithDate, advice])

  if (goalsWithDate.length === 0) {
    return (
      <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] p-5 text-center text-xs text-[var(--text-muted)]">
        Nessun obiettivo con scadenza impostato. Aggiungi una data ai tuoi obiettivi per visualizzare la rotta temporale.
      </div>
    )
  }

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] p-6 mb-6">
      <div className="flex items-baseline justify-between mb-8">
        <h2 className="font-display text-base font-semibold text-[var(--text-primary)]">La tua rotta verso gli obiettivi</h2>
        <span className="text-[11px] text-[var(--text-secondary)] font-medium">
          {format(new Date(), 'MMM yyyy', { locale: it })} → {format(parseISO(goalsWithDate[goalsWithDate.length - 1]?.target_date || new Date().toISOString()), 'MMM yyyy', { locale: it })}
        </span>
      </div>

      <div className="relative h-20 mx-2 mt-4 select-none">
        {/* Asse della timeline */}
        <div className="absolute left-0 right-0 top-7 h-[2px] bg-[var(--border-subtle)]" />

        {/* Mesi dell'asse X */}
        <div className="flex justify-between absolute left-0 right-0 bottom-0 text-[10px] text-[var(--text-muted)] font-medium px-1">
          {timelineMonths.map((m, i) => (
            <span key={i} className="capitalize">{m.label}</span>
          ))}
        </div>

        {/* Indicatore Oggi */}
        <div 
          className="absolute top-2 w-[2px] h-6 bg-[var(--text-primary)] transition-all"
          style={{ left: `${todayPosition}%` }}
        >
          <div className="absolute top-[-16px] text-[10px] font-bold text-[var(--text-primary)] whitespace-nowrap transform -translate-x-[45%]">
            Oggi
          </div>
        </div>

        {/* Punti degli obiettivi */}
        {points.map(pt => (
          <div 
            key={pt.id}
            className="absolute transition-all"
            style={{ left: `${pt.position}%` }}
          >
            {/* Tag/Tooltip fluttuante */}
            <div 
              className={clsx(
                "absolute left-1/2 transform -translate-x-1/2 -translate-y-full px-2 py-0.5 rounded-md text-[9px] font-bold shadow-sm border border-[var(--border-subtle)] bg-[var(--bg-surface)] whitespace-nowrap leading-tight text-center pointer-events-none transition-all",
                pt.verticalOffset
              )}
            >
              <div className="text-[var(--text-primary)]">{pt.name}</div>
              <div className="text-[9px] font-normal text-[var(--text-muted)]">{pt.targetAmount} €</div>
            </div>

            {/* Punto interattivo */}
            <div 
              className={clsx(
                "w-3.5 h-3.5 rounded-full border-2 border-[var(--bg-surface)] transform -translate-x-1/2 translate-y-5 shadow-sm transition-transform hover:scale-125 cursor-help",
                pt.isCompleted && "bg-[var(--color-success)]",
                !pt.isCompleted && pt.isAtRisk && "bg-[var(--color-danger)]",
                !pt.isCompleted && !pt.isAtRisk && "bg-[var(--color-primary)]"
              )}
              title={`${pt.name}: ${pt.targetAmount} €`}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
