import { useMemo } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { useFinanceStore } from '@/store/useFinanceStore'
import { useFirmeStore } from '@/store/useFirmeStore'
import { useCalendarStore } from '@/store/useCalendarStore'
import { useSavingsStore } from '@/store/useSavingsStore'
import { useHealthStore } from '@/store/useHealthStore'
import Header from '@/components/layout/Header'
import PageWrapper from '@/components/layout/PageWrapper'
import KpiRow from './KpiRow'
import QuickActions from './QuickActions'
import FinancePreview from './FinancePreview'
import WorkWeekPreview from './WorkWeekPreview'
import UpcomingEvents from './UpcomingEvents'
import HealthPreview from './HealthPreview'
import { format } from 'date-fns'
import { formatCurrency } from '@/lib/formatters'

function Overview() {
  const { userConfig, selectedMonth } = useAppStore()
  const { transactions } = useFinanceStore()
  const { sessions } = useFirmeStore()
  const { events } = useCalendarStore()
  const { plans } = useSavingsStore()
  const { workoutSessions } = useHealthStore()

  // ── KPI derivati ──
  const kpis = useMemo(() => {
    // Saldo
    const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount || 0), 0)
    const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount || 0), 0)
    const bankBase = parseFloat(userConfig?.initial_bank_balance) || 0
    const cashBase = parseFloat(userConfig?.initial_cash_balance) || 0
    const saldo = bankBase + cashBase + income - expense

    // Ore lavorate
    const totalMinutes = sessions.reduce((s, sess) => s + (sess.duration_minutes || 0), 0)

    // Prossimo evento (Smart)
    const now = new Date()
    const todayStr = format(now, 'yyyy-MM-dd')
    const currentTimeStr = format(now, 'HH:mm')
    
    const upcoming = events
      .filter(e => {
        if (e.date > todayStr) return true
        if (e.date === todayStr) {
          if (e.all_day) return true
          return (e.start_time || '00:00') >= currentTimeStr
        }
        return false
      })
      .sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date)
        return (a.start_time || '00:00').localeCompare(b.start_time || '00:00')
      })

    // Risparmio attivo
    const activePlan = plans.find(p => p.is_active) || null
    const planProgress = activePlan && parseFloat(activePlan.target_amount) > 0
      ? (parseFloat(activePlan.current_amount) / parseFloat(activePlan.target_amount) * 100).toFixed(0)
      : null

    return { saldo, income, expense, totalMinutes, upcoming, activePlan, planProgress }
  }, [transactions, sessions, events, plans, userConfig])

  return (
    <>
      <Header title="Panoramica" showMonth showNotification />
      <PageWrapper>
        <div className="space-y-3 lg:flex lg:flex-col lg:gap-3 lg:space-y-0 lg:h-full lg:overflow-hidden">
          {/* Riga 1: KPI cards */}
          <KpiRow kpis={kpis} userConfig={userConfig} />

          {/* Riga 2: Azioni rapide */}
          <QuickActions />

          {/* Riga 3: Grafici — altezza fissa su mobile, flex su desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:flex-1 lg:min-h-0">
            <div className="h-[240px] lg:h-full">
              <FinancePreview transactions={transactions} />
            </div>
            <div className="h-[180px] lg:h-full">
              <WorkWeekPreview sessions={sessions} userConfig={userConfig} />
            </div>
          </div>

          {/* Riga 4: Eventi & Salute */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:shrink-0">
            <UpcomingEvents events={kpis.upcoming} />
            <HealthPreview workouts={workoutSessions} userConfig={userConfig} />
          </div>
        </div>
      </PageWrapper>
    </>
  )
}

export default Overview
