import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Wallet, Clock, Calendar, PiggyBank } from 'lucide-react'
import { formatCurrency, formatDuration } from '@/lib/formatters'
import Card from '@/components/ui/Card'

function KpiRow({ kpis, userConfig }) {
  const net = kpis.income - kpis.expense

  const cards = [
    {
      label: 'Saldo totale',
      icon: Wallet,
      iconBg: 'rgba(180,98,67,0.12)',
      iconColor: '#B46243',
      content: (
        <>
          <p className="text-lg font-semibold font-num text-[var(--text-primary)] leading-tight">
            €{kpis.saldo.toLocaleString('it-IT', { minimumFractionDigits: 0 })}
          </p>
          <div className={`flex items-center gap-1 mt-0.5 text-[10px] font-medium ${net >= 0 ? 'text-[#3d9970]' : 'text-[#e05252]'}`}>
            {net >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            <span>{net >= 0 ? '+' : ''}{formatCurrency(net, true)}</span>
            <span className="text-[var(--text-muted)]">questo mese</span>
          </div>
        </>
      ),
    },
    {
      label: 'Ore lavorate',
      icon: Clock,
      iconBg: 'rgba(74,144,217,0.12)',
      iconColor: '#4a90d9',
      content: (
        <p className="text-lg font-semibold font-num text-[var(--text-primary)] leading-tight">
          {formatDuration(kpis.totalMinutes)}
        </p>
      ),
    },
    {
      label: 'Prossimo evento',
      icon: Calendar,
      iconBg: 'rgba(155,89,182,0.12)',
      iconColor: '#9b59b6',
      content: kpis.upcoming?.[0] ? (
        <div>
          <p className="text-xs font-semibold text-[var(--text-primary)] leading-tight line-clamp-1">
            {kpis.upcoming[0].title}
          </p>
          <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
            {new Date(kpis.upcoming[0].date).toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' })}
            {kpis.upcoming[0].start_time && `, ${kpis.upcoming[0].start_time.slice(0, 5)}`}
          </p>
        </div>
      ) : (
        <p className="text-xs text-[var(--text-muted)]">Nessun evento</p>
      ),
    },
    {
      label: 'Risparmio attivo',
      icon: PiggyBank,
      iconBg: 'rgba(61,153,112,0.12)',
      iconColor: '#3d9970',
      content: kpis.activePlan ? (
        <div>
          <p className="text-lg font-semibold font-num text-[var(--text-primary)] leading-tight">
            €{parseFloat(kpis.activePlan.current_amount || 0).toLocaleString('it-IT')}
          </p>
          <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
            {kpis.activePlan.name} — {kpis.planProgress}%
          </p>
        </div>
      ) : (
        <p className="text-xs text-[var(--text-muted)]">Nessun piano</p>
      ),
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 shrink-0">
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06, duration: 0.3 }}
        >
          <Card padding="md">
            <div className="flex items-start gap-2.5">
              <div
                className="w-8 h-8 rounded-[var(--radius-sm)] flex items-center justify-center shrink-0"
                style={{ backgroundColor: card.iconBg }}
              >
                <card.icon size={16} style={{ color: card.iconColor }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[9px] uppercase tracking-wider font-medium text-[var(--text-muted)] mb-0.5 leading-none">
                  {card.label}
                </p>
                {card.content}
              </div>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}

export default KpiRow
