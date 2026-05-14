import { Clock, TrendingUp, AlertCircle, CheckCircle2, DollarSign, Calendar } from 'lucide-react'
import { formatDuration, formatCurrency } from '@/lib/formatters'
import Card from '@/components/ui/Card'

function WorkStats({ sessions, userConfig }) {
  const totalMinutes = sessions.reduce((s, sess) => s + (sess.duration_minutes || 0), 0)
  
  // Calcolo target mensile teorico
  const weeklyTargetMinutes = (userConfig?.work_hours_per_week || 40) * 60
  const monthlyTargetMinutes = weeklyTargetMinutes * 4.33
  
  const progress = Math.min(100, (totalMinutes / monthlyTargetMinutes) * 100)
  
  // Media giornaliera (basata sui giorni unici lavorati)
  const uniqueDays = new Set(sessions.map(s => s.date)).size
  const dailyAverageMinutes = uniqueDays > 0 ? totalMinutes / uniqueDays : 0

  // Guadagno stimato (se configurato)
  const hourlyRate = parseFloat(userConfig?.hourly_rate || 0)
  const estimatedEarnings = (totalMinutes / 60) * hourlyRate

  const stats = [
    {
      label: 'Ore Totali',
      value: formatDuration(totalMinutes),
      icon: Clock,
      color: '#3d9970',
    },
    {
      label: 'Media Giornaliera',
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
      label: 'Progresso Target',
      value: `${progress.toFixed(1)}%`,
      icon: progress >= 100 ? CheckCircle2 : AlertCircle,
      color: progress >= 100 ? '#3d9970' : '#ff4136',
    },
  ].filter(s => !s.hidden)

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((stat) => (
        <Card key={stat.label} padding="sm" className="flex items-center gap-3">
          <div 
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${stat.color}15`, color: stat.color }}
          >
            <stat.icon size={18} />
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-wider font-bold text-[var(--text-muted)] mb-0.5">
              {stat.label}
            </p>
            <p className="text-sm font-bold text-[var(--text-primary)] leading-none">
              {stat.value}
            </p>
          </div>
        </Card>
      ))}
    </div>
  )
}

export default WorkStats
