import { Clock, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react'
import { formatDuration } from '@/lib/formatters'
import Card from '@/components/ui/Card'
import AnimatedNumber from '@/components/ui/AnimatedNumber'

function WorkStats({ sessions, userConfig }) {
  const totalMinutes = sessions.reduce((s, sess) => s + (sess.duration_minutes || 0), 0)
  
  // Calcolo target mensile teorico
  // Semplificato: ore_settimanali * 4.33
  const weeklyTargetMinutes = (userConfig?.work_hours_per_week || 40) * 60
  const monthlyTargetMinutes = weeklyTargetMinutes * 4.33
  
  const progress = Math.min(100, (totalMinutes / monthlyTargetMinutes) * 100)
  const isOvertime = totalMinutes > monthlyTargetMinutes

  const stats = [
    {
      label: 'Totale Ore',
      value: formatDuration(totalMinutes),
      icon: Clock,
      color: 'var(--text-primary)',
    },
    {
      label: 'Target Mensile',
      value: formatDuration(monthlyTargetMinutes),
      icon: TrendingUp,
      color: 'var(--text-primary)',
    },
    {
      label: 'Progresso',
      value: `${progress.toFixed(0)}%`,
      icon: progress >= 100 ? CheckCircle2 : AlertCircle,
      color: 'var(--text-primary)',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {stats.map((stat) => (
        <Card key={stat.label} padding="sm" className="flex items-center gap-4">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${stat.color}15`, color: stat.color }}
          >
            <stat.icon size={20} />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider font-bold text-[var(--text-muted)] mb-0.5">
              {stat.label}
            </p>
            <p className="text-lg font-bold text-[var(--text-primary)] leading-none">
              {stat.value}
            </p>
          </div>
        </Card>
      ))}
    </div>
  )
}

export default WorkStats
