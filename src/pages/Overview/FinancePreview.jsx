import { useState, useMemo } from 'react'
import { formatCurrency } from '@/lib/formatters'
import Card from '@/components/ui/Card'
import { BarChartWidget } from '@/components/charts/BarChart'
import clsx from 'clsx'
import { format, startOfWeek, endOfWeek, eachDayOfInterval, startOfMonth, endOfMonth, getWeek } from 'date-fns'
import { it } from 'date-fns/locale'
import { useAppStore } from '@/store/useAppStore'

const VIEWS = ['Settimana', 'Mese', 'Anno']

function FinancePreview({ transactions }) {
  const [view, setView] = useState('Settimana')
  const { selectedMonth } = useAppStore()
  const monthDate = new Date(selectedMonth)

  const chartData = useMemo(() => {
    if (view === 'Settimana') {
      const start = startOfWeek(new Date(), { weekStartsOn: 1 })
      const end = endOfWeek(new Date(), { weekStartsOn: 1 })
      const days = eachDayOfInterval({ start, end })
      return days.map((d) => {
        const key = format(d, 'yyyy-MM-dd')
        const income = transactions
          .filter(t => t.date === key && t.type === 'income')
          .reduce((s, t) => s + parseFloat(t.amount), 0)
        const expense = transactions
          .filter(t => t.date === key && t.type === 'expense')
          .reduce((s, t) => s + parseFloat(t.amount), 0)
        return { date: format(d, 'EEE', { locale: it }), income, expense }
      })
    } else if (view === 'Mese') {
      // Raggruppa per settimana
      const start = startOfMonth(monthDate)
      const end = endOfMonth(monthDate)
      const days = eachDayOfInterval({ start, end })
      const weeks = {}
      days.forEach((d) => {
        const w = `S${getWeek(d, { weekStartsOn: 1 })}`
        if (!weeks[w]) weeks[w] = { date: w, income: 0, expense: 0 }
        const key = format(d, 'yyyy-MM-dd')
        transactions.forEach((t) => {
          if (t.date === key) {
            if (t.type === 'income') weeks[w].income += parseFloat(t.amount)
            else if (t.type === 'expense') weeks[w].expense += parseFloat(t.amount)
          }
        })
      })
      return Object.values(weeks)
    } else {
      // Anno — per mese
      const months = []
      for (let m = 0; m < 12; m++) {
        const key = format(new Date(monthDate.getFullYear(), m, 1), 'MMM', { locale: it })
        const prefix = format(new Date(monthDate.getFullYear(), m, 1), 'yyyy-MM')
        const income = transactions
          .filter(t => t.date.startsWith(prefix) && t.type === 'income')
          .reduce((s, t) => s + parseFloat(t.amount), 0)
        const expense = transactions
          .filter(t => t.date.startsWith(prefix) && t.type === 'expense')
          .reduce((s, t) => s + parseFloat(t.amount), 0)
        months.push({ date: key, income, expense })
      }
      return months
    }
  }, [transactions, view, selectedMonth, monthDate])

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount), 0)
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0)

  return (
    <Card padding="md" className="flex flex-col min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-2 shrink-0">
        <div>
          <p className="text-xs font-medium text-[var(--text-primary)]">Flusso finanziario</p>
          <p className="text-[10px] text-[var(--text-muted)]">
            Entrate e uscite — {format(monthDate, 'MMMM yyyy', { locale: it })}
          </p>
        </div>
        <div className="flex bg-[var(--bg-elevated)] rounded-full p-0.5">
          {VIEWS.map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={clsx(
                'px-2.5 py-1 text-[10px] font-medium rounded-full transition-all',
                view === v
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              )}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* KPI bar */}
      <div className="flex gap-3 mb-2 shrink-0">
        <div className="flex items-center gap-1.5 text-[10px]">
          <span className="w-2 h-2 rounded-full bg-[var(--color-success)]" />
          <span className="text-[var(--text-muted)]">Entrate</span>
          <span className="font-semibold font-num text-[var(--text-primary)]">{formatCurrency(totalIncome, true)}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px]">
          <span className="w-2 h-2 rounded-full bg-[var(--color-danger)]" />
          <span className="text-[var(--text-muted)]">Uscite</span>
          <span className="font-semibold font-num text-[var(--text-primary)]">{formatCurrency(totalExpense, true)}</span>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-[120px]">
        <BarChartWidget
          data={chartData}
          bars={[
            { key: 'income',  color: '#3d9970', label: 'Entrate' },
            { key: 'expense', color: '#e05252', label: 'Uscite' },
          ]}
          formatY={(v) => `€${v}`}
        />
      </div>
    </Card>
  )
}

export default FinancePreview
