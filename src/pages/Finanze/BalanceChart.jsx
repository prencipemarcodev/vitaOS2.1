import { useMemo } from 'react'
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import Card from '@/components/ui/Card'
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isBefore, addDays } from 'date-fns'
import { it } from 'date-fns/locale'
import { useAppStore } from '@/store/useAppStore'
import { useFinanceStore } from '@/store/useFinanceStore'

function BalanceChart({ userConfig, selectedAccount = 'all' }) {
  const { selectedMonth } = useAppStore()
  const { historicalTransactions } = useFinanceStore()

  const chartData = useMemo(() => {
    const monthDate = new Date(selectedMonth)
    const start = startOfMonth(monthDate)
    const end = endOfMonth(monthDate)
    const days = eachDayOfInterval({ start, end })

    const bankBase = selectedAccount === 'all' || selectedAccount === 'bank' ? parseFloat(userConfig?.initial_bank_balance || 0) : 0
    const cashBase = selectedAccount === 'all' || selectedAccount === 'cash' ? parseFloat(userConfig?.initial_cash_balance || 0) : 0
    
    // Calcoliamo la somma delle transazioni prima del mese corrente
    const monthStartStr = format(start, 'yyyy-MM-dd')
    const filteredHistory = selectedAccount === 'all'
      ? historicalTransactions
      : historicalTransactions.filter(t => t.payment_method === selectedAccount)

    const priorTxs = filteredHistory.filter(t => t.date < monthStartStr)
    const priorNet = priorTxs.reduce((sum, t) => sum + (t.type === 'income' ? parseFloat(t.amount || 0) : -parseFloat(t.amount || 0)), 0)
    
    let currentTotal = bankBase + cashBase + priorNet
    const today = new Date()

    return days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd')
      const dayTxs = filteredHistory.filter(t => t.date === dayStr)
      const net = dayTxs.reduce((sum, t) => sum + (t.type === 'income' ? parseFloat(t.amount || 0) : -parseFloat(t.amount || 0)), 0)
      
      const isPastOrToday = isBefore(day, addDays(today, 1))
      if (isPastOrToday) {
        currentTotal += net
      }

      return {
        date: format(day, 'dd/MM'),
        balance: currentTotal,
        isFuture: !isPastOrToday,
        fullDate: format(day, 'EEEE dd MMMM', { locale: it })
      }
    }).filter(d => !d.isFuture)
  }, [historicalTransactions, userConfig, selectedMonth, selectedAccount])

  return (
    <Card padding="md" className="h-[240px] flex flex-col">
      <h3 className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)] mb-4">Saldo</h3>
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
              domain={['auto', 'auto']}
              padding={{ top: 10, bottom: 10 }}
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
