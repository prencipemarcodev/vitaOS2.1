import { useMemo } from 'react'
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine 
} from 'recharts'
import { format, addMonths, startOfMonth, parseISO, isAfter } from 'date-fns'
import { it } from 'date-fns/locale'

export default function PACChart({ plan, movements = [] }) {
  const data = useMemo(() => {
    if (plan.type === 'piggy_bank') {
      // Per il salvadanaio mostriamo solo lo storico degli ultimi 6 mesi
      const last6Months = []
      for (let i = 5; i >= 0; i--) {
        const d = startOfMonth(addMonths(new Date(), -i))
        last6Months.push({
          date: d,
          name: format(d, 'MMM', { locale: it }),
          reale: 0
        })
      }

      // Popola con i movimenti reali
      let rollingSum = 0
      // Nota: in un'app reale qui calcoleremmo il saldo all'inizio dei 6 mesi
      // Per ora simuliamo la crescita basata sui movimenti presenti
      return last6Months.map(month => {
        const monthMovements = movements.filter(m => {
          const mDate = parseISO(m.date)
          return mDate.getMonth() === month.date.getMonth() && mDate.getFullYear() === month.date.getFullYear()
        })
        const monthTotal = monthMovements.reduce((s, m) => s + parseFloat(m.amount), 0)
        rollingSum += monthTotal
        return { ...month, reale: Math.max(0, rollingSum) }
      })
    }

    // Per i piani a OBIETTIVO (PAC)
    const targetDate = plan.target_date ? parseISO(plan.target_date) : addMonths(new Date(), 12)
    const startDate = plan.created_at ? parseISO(plan.created_at) : addMonths(new Date(), -3)
    const totalAmount = parseFloat(plan.target_amount)
    const monthlyContrib = parseFloat(plan.monthly_contribution || 0)
    
    const chartPoints = []
    let currentDate = startOfMonth(startDate)
    const endDate = startOfMonth(addMonths(targetDate, 1))

    let currentReal = 0
    let currentIdeal = 0
    const monthsTotal = Math.max(1, (targetDate.getFullYear() - startDate.getFullYear()) * 12 + (targetDate.getMonth() - startDate.getMonth()))
    const idealStep = totalAmount / monthsTotal

    while (currentDate <= endDate) {
      const isFuture = isAfter(currentDate, new Date())
      
      // Calcolo ideale
      const monthsFromStart = (currentDate.getFullYear() - startDate.getFullYear()) * 12 + (currentDate.getMonth() - startDate.getMonth())
      currentIdeal = Math.min(totalAmount, Math.max(0, idealStep * monthsFromStart))

      // Calcolo reale (storico + proiezione)
      if (!isFuture) {
        const monthMovements = movements.filter(m => {
          const mDate = parseISO(m.date)
          return mDate.getMonth() === currentDate.getMonth() && mDate.getFullYear() === currentDate.getFullYear()
        })
        currentReal += monthMovements.reduce((s, m) => s + parseFloat(m.amount), 0)
      } else {
        currentReal += monthlyContrib
      }

      chartPoints.push({
        name: format(currentDate, 'MMM', { locale: it }),
        reale: parseFloat(currentReal.toFixed(2)),
        ideale: parseFloat(currentIdeal.toFixed(2)),
        isFuture
      })

      currentDate = addMonths(currentDate, 1)
      if (chartPoints.length > 24) break // Cap a 2 anni
    }

    return chartPoints
  }, [plan, movements])

  return (
    <div className="relative h-32 w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" opacity={0.5} />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 9, fill: 'var(--text-muted)' }} 
            interval="preserveStartEnd"
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'var(--bg-elevated)', 
              borderRadius: '12px', 
              border: '1px solid var(--border-subtle)',
              fontSize: '10px'
            }}
          />
          {plan.type !== 'piggy_bank' && (
            <Area 
              type="monotone" 
              dataKey="ideale" 
              stroke="#cbd5e1" 
              strokeWidth={1} 
              strokeDasharray="5 5"
              fill="transparent" 
              name="Target Ideale"
            />
          )}
          <Area 
            type="monotone" 
            dataKey="reale" 
            stroke="var(--color-primary)" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorReal)" 
            name="Risparmio Reale"
          />
          {plan.type !== 'piggy_bank' && (
            <ReferenceLine y={plan.target_amount} stroke="var(--color-danger)" strokeDasharray="3 3" opacity={0.3} />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
