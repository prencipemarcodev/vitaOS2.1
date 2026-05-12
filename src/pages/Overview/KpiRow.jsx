import { motion } from 'framer-motion'
import { Wallet, Clock, Calendar, PiggyBank } from 'lucide-react'
import { formatCurrency, formatDuration } from '@/lib/formatters'
import Card from '@/components/ui/Card'

function KpiRow({ kpis, userConfig }) {
  const net = kpis.income - kpis.expense

  const cards = [
    {
      label: 'Saldo totale',
      icon: Wallet,
      value: `€${kpis.saldo.toLocaleString('it-IT', { minimumFractionDigits: 0 })}`,
      sub: `${net >= 0 ? '+' : ''}${formatCurrency(net, true)} questo mese`,
      subColor: net >= 0 ? '#3d9970' : '#e05252',
    },
    {
      label: 'Ore lavorate',
      icon: Clock,
      value: formatDuration(kpis.totalMinutes),
      sub: 'questo mese',
    },
    {
      label: 'Prossimo evento',
      icon: Calendar,
      value: kpis.upcoming?.[0]?.title || 'Nessun evento',
      valueIsText: true,
      sub: kpis.upcoming?.[0]
        ? new Date(kpis.upcoming[0].date).toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' })
        : '',
    },
    {
      label: 'Risparmio attivo',
      icon: PiggyBank,
      value: kpis.activePlan
        ? `€${parseFloat(kpis.activePlan.current_amount || 0).toLocaleString('it-IT')}`
        : 'Nessun piano',
      valueIsText: !kpis.activePlan,
      sub: kpis.activePlan ? `${kpis.activePlan.name} — ${kpis.planProgress}%` : '',
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
          <Card padding="sm" className="h-full">
            <div className="flex items-center gap-1.5 mb-1.5">
              <card.icon size={13} className="text-[var(--text-primary)] shrink-0" strokeWidth={2.5} />
              <p className="text-[9px] uppercase tracking-wider font-bold text-[var(--text-muted)] leading-none truncate">
                {card.label}
              </p>
            </div>
            <p className={`font-bold font-num leading-tight truncate ${card.valueIsText ? 'text-xs text-[var(--text-secondary)]' : 'text-base text-[var(--text-primary)]'}`}>
              {card.value}
            </p>
            {card.sub && (
              <p className="text-[9px] text-[var(--text-muted)] mt-0.5 truncate" style={card.subColor ? { color: card.subColor } : undefined}>
                {card.sub}
              </p>
            )}
          </Card>
        </motion.div>
      ))}
    </div>
  )
}

export default KpiRow
