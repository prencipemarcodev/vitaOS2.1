import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { formatCurrency, formatDuration } from '@/lib/formatters'
import AnimatedNumber from '@/components/ui/AnimatedNumber'
import Card from '@/components/ui/Card'

function KpiRow({ kpis, userConfig }) {
  const cards = [
    {
      label: 'Saldo totale',
      value: kpis.saldo,
      format: 'currency',
      delta: kpis.income - kpis.expense > 0 ? `+${formatCurrency(kpis.income - kpis.expense, true)}` : formatCurrency(kpis.income - kpis.expense, true),
      deltaPositive: kpis.income - kpis.expense >= 0,
      deltaSuffix: 'questo mese',
      accent: true,
    },
    {
      label: 'Ore lavorate',
      value: kpis.totalMinutes,
      format: 'duration',
      delta: null,
      accent: false,
    },
    {
      label: 'Prossimo evento',
      custom: kpis.upcoming?.[0] ? (
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)] leading-tight line-clamp-1">
            {kpis.upcoming[0].title}
          </p>
          <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
            {new Date(kpis.upcoming[0].date).toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' })}
            {kpis.upcoming[0].start_time && `, ${kpis.upcoming[0].start_time.slice(0,5)}`}
          </p>
        </div>
      ) : (
        <p className="text-xs text-[var(--text-muted)]">Nessun evento</p>
      ),
      accent: false,
    },
    {
      label: 'Risparmio attivo',
      custom: kpis.activePlan ? (
        <div>
          <p className="text-lg font-semibold font-num text-[var(--text-primary)]">
            €{parseFloat(kpis.activePlan.current_amount || 0).toLocaleString('it-IT')}
          </p>
          <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
            {kpis.activePlan.name} — {kpis.planProgress}%
          </p>
        </div>
      ) : (
        <p className="text-xs text-[var(--text-muted)]">Nessun piano</p>
      ),
      accent: false,
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
          <Card
            padding="md"
            className={card.accent
              ? 'bg-[var(--color-primary)] text-white border-transparent'
              : ''
            }
          >
            <p className={`text-[10px] uppercase tracking-wider font-medium mb-1 ${card.accent ? 'text-white/70' : 'text-[var(--text-muted)]'}`}>
              {card.label}
            </p>

            {card.custom ? (
              card.custom
            ) : card.format === 'currency' ? (
              <p className={`text-xl font-semibold font-num leading-tight ${card.accent ? 'text-white' : 'text-[var(--text-primary)]'}`}>
                €<AnimatedNumber value={Math.abs(kpis.saldo)} decimals={0} />
              </p>
            ) : card.format === 'duration' ? (
              <p className="text-xl font-semibold font-num leading-tight text-[var(--text-primary)]">
                {formatDuration(card.value)}
              </p>
            ) : null}

            {card.delta && (
              <div className={`flex items-center gap-1 mt-1 text-[10px] font-medium ${card.accent ? (card.deltaPositive ? 'text-white/80' : 'text-white/80') : (card.deltaPositive ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]')}`}>
                {card.deltaPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                <span>{card.delta}</span>
                {card.deltaSuffix && <span className={card.accent ? 'text-white/50' : 'text-[var(--text-muted)]'}>{card.deltaSuffix}</span>}
              </div>
            )}
          </Card>
        </motion.div>
      ))}
    </div>
  )
}

export default KpiRow
