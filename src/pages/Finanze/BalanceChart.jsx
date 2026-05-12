import { useMemo } from 'react'
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import Card from '@/components/ui/Card'
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isSameDay, isBefore, addDays } from 'date-fns'
import { it } from 'date-fns/locale'

function BalanceChart({ transactions, userConfig }) {
  const chartData = useMemo(() => {
    const today = new Date()
    const start = startOfMonth(today)
    const end = endOfMonth(today)
    const days = eachDayOfInterval({ start, end })

    const bankBase = parseFloat(userConfig?.initial_bank_balance || 0)
    const cashBase = parseFloat(userConfig?.initial_cash_balance || 0)
    let currentTotal = bankBase + cashBase

    return days.map(day => {
      const dayTxs = transactions.filter(t => isSameDay(new Date(t.date), day))
      const net = dayTxs.reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0)
      
      if (isBefore(day, addDays(today, 1))) {
        currentTotal += net
      }

      return {
        date: format(day, 'dd/MM'),
        balance: currentTotal,
        isFuture: isBefore(addDays(today, 0), day),
        fullDate: format(day, 'EEEE dd MMMM', { locale: it })
      }
    }).filter(d => !d.isFuture)
  }, [transactions, userConfig])

  return (
    <Card padding="md" className="h-[240px] flex flex-col">
      <h3 className="text-sm font-bold text-[var(--text-primary)] mb-4">Andamento Saldo</h3>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
              interval={4}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: 'var(--text-muted)' }} 
              domain={['dataMin - 100', 'dataMax + 100']}
            />
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-white border border-[var(--border-subtle)] p-4 shadow-2xl rounded-[var(--radius-lg)]">
                      <p className="text-[10px] font-bold text-[var(--text-muted)] mb-1 uppercase tracking-widest">
                        {payload[0].payload.fullDate}
                      </p>
                      <p className="text-lg font-bold text-[var(--text-primary)]">
                        €{payload[0].value.toLocaleString('it-IT')}
                      </p>
                    </div>
                  )
                }
                return null
              }}
            />
            <Area 
              type="monotone" 
              dataKey="balance" 
              stroke="var(--color-primary)" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorBalance)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}

export default BalanceChart
