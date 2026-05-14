import Card from '@/components/ui/Card'
import { Dumbbell, TrendingUp } from 'lucide-react'
import { startOfWeek, endOfWeek, format } from 'date-fns'

function HealthPreview({ workouts = [], userConfig }) {
  const weeklyGoal = userConfig?.workout_weekly_goal || 4
  const runGoal = parseFloat(userConfig?.run_monthly_goal_km) || 50

  // Allenamenti questa settimana
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
  const weekEnd = format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
  const thisWeekWorkouts = workouts.filter(w => w.date >= weekStart && w.date <= weekEnd)

  // Km corsa questo mese
  const monthPrefix = format(new Date(), 'yyyy-MM')
  const monthRuns = workouts.filter(w => w.date.startsWith(monthPrefix) && w.run_distance_km)
  const totalKm = monthRuns.reduce((s, w) => s + parseFloat(w.run_distance_km || 0), 0)
  const kmPct = runGoal > 0 ? Math.min((totalKm / runGoal) * 100, 100) : 0

  return (
    <Card padding="sm" className="min-h-0 flex flex-col">
      <p className="text-xs font-medium text-[var(--text-primary)] mb-2 shrink-0">Salute</p>

      <div className="grid grid-cols-2 gap-3 flex-1">
        {/* Workout count */}
        <div className="flex flex-col items-center justify-center p-3 rounded-[var(--radius-md)] border border-[var(--border-subtle)]">
          <Dumbbell size={18} className="text-[var(--color-primary)] mb-1" />
          <p className="text-lg font-semibold font-num text-[var(--text-primary)]">
            {thisWeekWorkouts.length}<span className="text-xs text-[var(--text-muted)] font-normal">/{weeklyGoal}</span>
          </p>
          <p className="text-[10px] text-[var(--text-muted)]">Questa settimana</p>
        </div>

        {/* Run km */}
        <div className="flex flex-col items-center justify-center p-3 rounded-[var(--radius-md)] border border-[var(--border-subtle)]">
          <TrendingUp size={18} className="text-[var(--color-success)] mb-1" />
          <p className="text-lg font-semibold font-num text-[var(--text-primary)]">
            {totalKm.toFixed(1)}<span className="text-xs text-[var(--text-muted)] font-normal">km</span>
          </p>
          <div className="w-full mt-1.5">
            <div className="h-1 w-full bg-[var(--bg-hover)] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-[var(--color-success)] transition-all duration-500"
                style={{ width: `${kmPct}%` }}
              />
            </div>
            <p className="text-[9px] text-[var(--text-muted)] text-center mt-0.5">
              {kmPct.toFixed(0)}% di {runGoal}km
            </p>
          </div>
        </div>
      </div>
    </Card>
  )
}

export default HealthPreview
