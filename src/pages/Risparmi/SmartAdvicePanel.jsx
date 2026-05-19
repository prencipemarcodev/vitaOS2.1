import { useMemo } from 'react'
import { useSavingsStore } from '@/store/useSavingsStore'
import { useFinanceStore } from '@/store/useFinanceStore'
import { useAppStore } from '@/store/useAppStore'
import { calculateSmartAdvice } from '@/lib/smartSavings'
import { formatCurrency } from '@/lib/formatters'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Sparkles, AlertCircle, TrendingUp } from 'lucide-react'
import { motion } from 'framer-motion'

function SmartAdvicePanel() {
  const { plans } = useSavingsStore()
  const { transactions, cumulativeBalance } = useFinanceStore()
  const { userConfig, selectedMonth } = useAppStore()

  const totalBalance = cumulativeBalance

  const advice = useMemo(() => {
    return calculateSmartAdvice({ 
      userConfig, 
      transactions, 
      plans, 
      selectedMonth,
      totalBalance
    })
  }, [userConfig, transactions, plans, selectedMonth, totalBalance])

  if (!advice || plans.length === 0) return null

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
        <Sparkles size={16} className="text-[#ff851b]" />
        Smart Advice
      </h3>

      <Card padding="md" className="bg-[var(--bg-elevated)] border-dashed border-2 border-[var(--border-strong)] relative overflow-hidden">
        {/* Shine effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_3s_infinite]" />

        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-[var(--color-primary-ghost)] border border-[var(--color-primary)]/10">
            <p className="text-[11px] font-bold text-[var(--color-primary)] uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <TrendingUp size={12} />
              Il consiglio del tuo commercialista
            </p>
            <p className="text-xs text-[var(--text-secondary)] italic leading-relaxed">
              "{advice.coachAdvice}"
            </p>
          </div>

          <div className="flex gap-3">
            <div className="space-y-1">
              <p className="text-xs text-[var(--text-primary)] leading-relaxed">
                Sulla base del tuo surplus di <span className="font-bold">{formatCurrency(advice.surplus)}</span>, 
                ti consigliamo di accantonare <span className="text-[var(--color-success)] font-bold">{formatCurrency(advice.suggestedBudget)}</span> questo mese.
              </p>
            </div>
          </div>

            <div className="space-y-3">
              <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Distribuzione consigliata:</p>
              <div className="space-y-2">
                {advice.allocations.map((alloc, idx) => {
                  const plan = plans.find(p => p.id === alloc.plan_id)
                  const isGoal = plan?.type !== 'piggy_bank'
                  const progress = (isGoal && plan?.target_amount) 
                    ? (parseFloat(plan.current_amount || 0) / parseFloat(plan.target_amount)) * 100 
                    : 0
                  
                  return (
                    <motion.div 
                      key={alloc.plan_id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="space-y-1"
                    >
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="font-medium text-[var(--text-secondary)]">{alloc.plan_name}</span>
                        <span className="font-bold text-[var(--text-primary)]">+{formatCurrency(alloc.amount)}</span>
                      </div>
                      <div className="h-1 bg-[var(--border-subtle)] rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[var(--color-primary)] opacity-60" 
                          style={{ width: `${progress}%` }} 
                        />
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>

            <Button 
              variant="primary" 
              size="xs" 
              className="w-full mt-2 font-bold"
              onClick={() => {
                // In un'app reale qui potresti triggerare i movimenti di risparmio massivamente
                alert('Funzionalità di applicazione automatica in fase di sviluppo. Puoi registrare i depositi manualmente nei singoli piani.')
              }}
            >
              Applica distribuzione
            </Button>
          </div>
      </Card>
    </div>
  )
}

export default SmartAdvicePanel
