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
import { startOfMonth, endOfMonth, format, isToday, isFuture, parseISO } from 'date-fns'

function Overview() {
  const { userConfig, selectedMonth } = useAppStore()
  const { transactions } = useFinanceStore()
  const { sessions } = useFirmeStore()
  const { events } = useCalendarStore()
  const { plans } = useSavingsStore()
  const { workoutSessions } = useHealthStore()

  const monthDate = new Date(selectedMonth)
  const mStart = startOfMonth(monthDate)
  const mEnd = endOfMonth(monthDate)

  // ── KPI derivati ──
  const kpis = useMemo(() => {
    // Saldo
    const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount), 0)
    const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0)
    const bankBase = parseFloat(userConfig?.initial_bank_balance) || 0
    const cashBase = parseFloat(userConfig?.initial_cash_balance) || 0
    const saldo = bankBase + cashBase + income - expense

    // Ore lavorate
    const totalMinutes = sessions.reduce((s, sess) => s + (sess.duration_minutes || 0), 0)

    // Prossimo evento
    const today = format(new Date(), 'yyyy-MM-dd')
    const upcoming = events
      .filter(e => e.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date))

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
        <div className="flex flex-col gap-3 h-full overflow-y-auto lg:overflow-hidden">
          {/* Riga 1: KPI cards */}
          <KpiRow kpis={kpis} userConfig={userConfig} />

          {/* Riga 2: Azioni rapide */}
          <QuickActions />

          {/* Riga 3: Grafici e preview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 flex-1 min-h-0">
            <FinancePreview transactions={transactions} />
            <WorkWeekPreview sessions={sessions} userConfig={userConfig} />
          </div>

          {/* Riga 4: Eventi & Salute (mobile: stack) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 shrink-0">
            <UpcomingEvents events={kpis.upcoming} />
            <HealthPreview workouts={workoutSessions} userConfig={userConfig} />
          </div>
        </div>
      </PageWrapper>
    </>
  )
}

export default Overview
