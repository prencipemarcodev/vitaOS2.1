import { Clock, TrendingUp, AlertCircle, CheckCircle2, DollarSign, Calendar, Zap } from 'lucide-react'
import { formatDuration, formatCurrency } from '@/lib/formatters'
import { calculateOvertime } from '@/lib/workCalculations'
import Card from '@/components/ui/Card'

function WorkStats({ sessions, userConfig }) {
  // Programma di default se non presente in config
  const defaultSchedule = {
    monday: { start: '09:00', end: '18:00', active: true },
    tuesday: { start: '09:00', end: '18:00', active: true },
    wednesday: { start: '09:00', end: '18:00', active: true },
    thursday: { start: '09:00', end: '18:00', active: true },
    friday: { start: '09:00', end: '18:00', active: true },
    saturday: { start: '09:00', end: '13:00', active: false },
    sunday: { start: '09:00', end: '13:00', active: false },
  }

  const schedule = userConfig?.work_schedule || defaultSchedule

  const totals = sessions.reduce((acc, sess) => {
    const { ordinary, overtime } = calculateOvertime(sess.date, sess.check_in, sess.check_out, schedule)
    acc.total += (sess.duration_minutes || 0)
    acc.ordinary += ordinary
    acc.overtime += overtime
    return acc
  }, { total: 0, ordinary: 0, overtime: 0 })

  // Calcolo target mensile teorico
  const weeklyTargetMinutes = (userConfig?.work_hours_per_week || 40) * 60
  const monthlyTargetMinutes = weeklyTargetMinutes * 4.33
  
  const progress = Math.min(100, (totals.total / monthlyTargetMinutes) * 100)
  
  // Media giornaliera
  const uniqueDays = new Set(sessions.map(s => s.date)).size
  const dailyAverageMinutes = uniqueDays > 0 ? totals.total / uniqueDays : 0

  // Guadagno stimato
  const hourlyRate = parseFloat(userConfig?.hourly_rate || 0)
  const estimatedEarnings = (totals.total / 60) * hourlyRate

  const stats = [
    {
      label: 'Ore Totali',
      value: formatDuration(totals.total),
      icon: Clock,
      color: '#3d9970',
    },
    {
      label: 'Straordinari',
      value: formatDuration(totals.overtime),
      icon: Zap,
      color: '#ff851b',
    },
    {
      label: 'Media Diaria',
      value: formatDuration(dailyAverageMinutes),
      icon: Calendar,
      color: '#4a90d9',
    },
    {
      label: 'Stima Guadagno',
      value: formatCurrency(estimatedEarnings),
      icon: DollarSign,
      color: '#ff851b',
      hidden: hourlyRate === 0
    },
    {
      label: 'Progresso',
      value: `${progress.toFixed(1)}%`,
      icon: progress >= 100 ? CheckCircle2 : AlertCircle,
      color: progress >= 100 ? '#3d9970' : '#ff4136',
    },
  ].filter(s => !s.hidden)

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
      {stats.map((stat) => (
        <Card key={stat.label} padding="sm" className="flex items-center gap-3">
          <div 
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${stat.color}15`, color: stat.color }}
          >
            <stat.icon size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] uppercase tracking-wider font-bold text-[var(--text-muted)] mb-0.5 truncate">
              {stat.label}
            </p>
            <p className="text-sm font-bold text-[var(--text-primary)] leading-none truncate">
              {stat.value}
            </p>
          </div>
        </Card>
      ))}
    </div>
  )
}

export default WorkStats
