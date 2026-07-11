import { useMemo, useState, useEffect } from 'react'
import { useSavingsStore } from '@/store/useSavingsStore'
import { useFinanceStore } from '@/store/useFinanceStore'
import { useAppStore } from '@/store/useAppStore'
import { calculateSmartAdvice } from '@/lib/smartSavings'
import { formatCurrency } from '@/lib/formatters'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { 
  Sparkles, AlertCircle, TrendingUp, Calendar, 
  ShieldCheck, AlertTriangle, ArrowRight,
  LineChart, CheckCircle2
} from 'lucide-react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

function SmartAdvicePanel() {
  const { plans, addMovement, updatePlan } = useSavingsStore()
  const { transactions, categories, cumulativeBalance, addTransaction, setCumulativeBalance } = useFinanceStore()
  const { userConfig, selectedMonth } = useAppStore()
  const [applying, setApplying] = useState(false)
  const [adjustedAllocations, setAdjustedAllocations] = useState({})

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

  const maxBudget = useMemo(() => {
    if (!advice) return 0
    const safety = userConfig?.liquidity_safety_threshold !== undefined 
      ? parseFloat(userConfig.liquidity_safety_threshold) 
      : 200
    // Il massimo budget è il surplus, ma limitato da quanto saldo effettivo abbiamo sopra la soglia
    return Math.max(0, Math.min(advice.surplus, totalBalance - safety))
  }, [advice, userConfig, totalBalance])

  // Inizializza lo stato degli slider quando l'advice cambia
  useEffect(() => {
    if (plans && advice) {
      const initial = {}
      plans.forEach(p => {
        initial[p.id] = 0
      })
      if (advice.allocations) {
        advice.allocations.forEach(a => {
          initial[a.plan_id] = a.amount
        })
      }
      setAdjustedAllocations(initial)
    }
  }, [plans, advice])

  const totalAllocated = useMemo(() => {
    return Object.values(adjustedAllocations).reduce((sum, val) => sum + val, 0)
  }, [adjustedAllocations])

  const handleSliderChange = (planId, value) => {
    setAdjustedAllocations(prev => {
      const copy = { ...prev }
      const oldVal = copy[planId] || 0
      const currentSum = Object.values(copy).reduce((s, v) => s + v, 0)
      const sumOthers = currentSum - oldVal
      
      const maxAllowed = Math.max(0, maxBudget - sumOthers)
      const clampedValue = Math.min(value, maxAllowed)
      
      copy[planId] = parseFloat(clampedValue.toFixed(2))
      return copy
    })
  }

  const resetToRecommended = () => {
    if (plans && advice) {
      const initial = {}
      plans.forEach(p => {
        initial[p.id] = 0
      })
      if (advice.allocations) {
        advice.allocations.forEach(a => {
          initial[a.plan_id] = a.amount
        })
      }
      setAdjustedAllocations(initial)
    }
  }

  const handleApply = async () => {
    const allocationsToApply = Object.entries(adjustedAllocations)
      .map(([planId, amount]) => ({
        plan_id: planId,
        plan_name: plans.find(p => p.id === planId)?.name || 'Piano',
        amount
      }))
      .filter(a => a.amount > 0)

    if (allocationsToApply.length === 0) return
    setApplying(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      let totalDeducted = 0

      // Cerca categoria "Risparmi" per le transazioni finanziarie
      const savingsCategory = categories.find(c => c.name.toLowerCase().includes('risparmi'))
      
      for (const alloc of allocationsToApply) {
        const allocAmount = parseFloat(alloc.amount.toFixed(2))

        const payload = {
          plan_id: alloc.plan_id,
          amount: allocAmount,
          type: 'deposit',
          date: today,
          notes: 'Accantonamento manuale distribuito tramite Smart Advice'
        }
        
        // 1. Inserisci il movimento in Supabase
        const { data: movementData, error: mError } = await supabase
          .from('saving_movements')
          .insert(payload)
          .select().single()
          
        if (mError) throw mError
        
        // 2. Aggiorna il saldo del piano
        const plan = plans.find(p => p.id === alloc.plan_id)
        if (plan) {
          const newAmount = parseFloat((parseFloat(plan.current_amount || 0) + allocAmount).toFixed(2))
          
          const { error: pError } = await supabase
            .from('saving_plans')
            .update({ current_amount: newAmount })
            .eq('id', alloc.plan_id)
            
          if (pError) throw pError
          
          // 3. Registra la transazione finanziaria (scalando il saldo)
          const { data: tx } = await supabase
            .from('transactions')
            .insert({
              amount: allocAmount,
              type: 'expense',
              category: savingsCategory?.name || 'Risparmio',
              description: `Accantonamento: ${alloc.plan_name}`,
              payment_method: 'bank',
              date: today
            })
            .select()
            .single()

          if (tx) addTransaction(tx)
          totalDeducted += allocAmount

          // 4. Aggiorna lo store Zustand
          addMovement(movementData)
          updatePlan(alloc.plan_id, { current_amount: newAmount })
        }
      }

      // 5. Aggiorna il saldo cumulativo in una sola volta
      if (totalDeducted > 0) {
        setCumulativeBalance(cumulativeBalance - totalDeducted)
      }

      toast.success('Distribuzione risparmio applicata con successo! 💰')
    } catch (err) {
      console.error(err)
      toast.error("Errore nell'applicazione della distribuzione")
    } finally {
      setApplying(false)
    }
  }

  if (!advice || plans.length === 0) return null

  return (
    <div className="space-y-4">
      {/* Title */}
      <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2 px-1">
        <Sparkles size={16} className="text-[#ff851b]" />
        Smart Advice
      </h3>

      {/* 1. LIQUIDITY HEALTH CARD */}
      <Card padding="md" className="bg-[var(--bg-surface)] border-l-4 relative overflow-hidden" style={{ borderLeftColor: `var(--color-${advice.liquidityStatus.color})` }}>
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
              {advice.liquidityStatus.color === 'success' && <ShieldCheck size={14} className="text-[var(--color-success)]" />}
              {advice.liquidityStatus.color === 'warning' && <AlertTriangle size={14} className="text-[var(--color-warning)]" />}
              {advice.liquidityStatus.color === 'danger' && <AlertCircle size={14} className="text-[var(--color-danger)]" />}
              Salute Finanziaria
            </p>
            <Badge variant={advice.liquidityStatus.color} className="text-[8px] font-bold uppercase tracking-wider py-0.5 px-2">
              {advice.liquidityStatus.color === 'success' && 'Sicura'}
              {advice.liquidityStatus.color === 'warning' && 'Attenzione'}
              {advice.liquidityStatus.color === 'danger' && 'Critica'}
            </Badge>
          </div>

          {/* Details */}
          <p className="text-xs text-[var(--text-primary)] leading-relaxed font-medium">
            {advice.liquidityStatus.message}
          </p>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--border-subtle)] text-[10px] text-[var(--text-secondary)] font-semibold">
            <div>
              <span className="block text-[var(--text-muted)] font-normal">Soglia Sicurezza</span>
              <span className="text-xs font-bold text-[var(--text-primary)]">{formatCurrency(advice.safetyThreshold)}</span>
            </div>
            <div>
              <span className="block text-[var(--text-muted)] font-normal">Saldo Attuale</span>
              <span className="text-xs font-bold text-[var(--text-primary)]">{formatCurrency(totalBalance)}</span>
            </div>
          </div>

          {/* Coach Advice */}
          <div className="p-3 rounded-xl bg-[var(--color-primary-ghost)] border border-[var(--color-primary)]/10 mt-1">
            <p className="text-[9px] font-black text-[var(--color-primary)] uppercase tracking-wider mb-1 flex items-center gap-1">
              <TrendingUp size={10} />
              Consiglio del Coach
            </p>
            <p className="text-[11px] text-[var(--text-secondary)] italic leading-relaxed">
              "{advice.coachAdvice}"
            </p>
          </div>
        </div>
      </Card>

      {/* 2. GOAL FORECASTS CARD */}
      <Card padding="md" className="bg-[var(--bg-surface)] relative overflow-hidden">
        <div className="space-y-3">
          <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
            <LineChart size={14} className="text-[var(--color-primary)]" />
            Previsioni & Tempistiche
          </p>

          <div className="space-y-3 divide-y divide-[var(--border-subtle)]">
            {advice.forecasts.map((f, idx) => {
              const plan = plans.find(p => p.id === f.planId)
              const missingAmount = plan ? Math.max(0, parseFloat(plan.target_amount || 0) - parseFloat(plan.current_amount || 0)) : 0

              return (
                <div key={f.planId} className={idx > 0 ? "pt-3 space-y-1.5" : "space-y-1.5"}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--text-primary)]">{f.planName}</span>
                    {f.isCompleted ? (
                      <Badge variant="success" className="text-[7px] py-0 px-1.5 uppercase flex items-center gap-0.5">
                        <CheckCircle2 size={8} /> Completato
                      </Badge>
                    ) : f.isAtRisk ? (
                      <Badge variant="danger" className="text-[7px] py-0 px-1.5 uppercase">
                        A Rischio
                      </Badge>
                    ) : f.type === 'piggy_bank' ? (
                      <Badge variant="primary" className="text-[7px] py-0 px-1.5 uppercase bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                        Emergenza
                      </Badge>
                    ) : (
                      <Badge variant="success" className="text-[7px] py-0 px-1.5 uppercase">
                        In Linea
                      </Badge>
                    )}
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-[var(--text-secondary)]">
                    <span className="flex items-center gap-1">
                      <Calendar size={11} className="text-[var(--text-muted)]" />
                      {f.isCompleted ? 'Traguardo raggiunto!' : `Stima: ${f.estimatedCompletionDate}`}
                    </span>
                    {!f.isCompleted && f.type === 'goal' && (
                      <span className="font-medium">
                        Rimanenti: <strong className="text-[var(--text-primary)]">{formatCurrency(missingAmount)}</strong>
                      </span>
                    )}
                  </div>

                  {/* Warning detail for at risk plans */}
                  {f.isAtRisk && f.extraContributionNeeded > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: -2 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-2 rounded-lg bg-[var(--color-danger-ghost)] border border-[var(--color-danger)]/10 text-[9px] text-[var(--color-danger)] font-bold flex items-center gap-1"
                    >
                      <AlertCircle size={10} />
                      Aggiungi {formatCurrency(f.extraContributionNeeded)}/mese per rispettare la scadenza.
                    </motion.div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </Card>

      {/* 3. SURPLUS ALLOCATION CARD */}
      {maxBudget > 0 && plans.filter(p => p.is_active).length > 0 && (
        <Card padding="md" className="bg-[var(--bg-surface)] border-dashed border-2 border-[var(--border-strong)] relative overflow-hidden">
          {/* Shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_3s_infinite]" />

          <div className="space-y-4">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1.5">
                <ArrowRight size={14} className="text-[#ff851b]" />
                Distribuzione Personalizzata
              </p>
              <p className="text-xs text-[var(--text-primary)] leading-relaxed">
                Surplus mensile: <span className="font-bold">{formatCurrency(advice.surplus)}</span>. Puoi distribuire fino a <span className="text-[var(--color-success)] font-bold">{formatCurrency(maxBudget)}</span> (rispettando la soglia di sicurezza):
              </p>
            </div>

            <div className="space-y-3.5">
              {plans.filter(p => p.is_active).map((plan, idx) => {
                const amount = adjustedAllocations[plan.id] || 0
                
                // Max for this slider: remaining budget + current amount
                const currentSum = Object.values(adjustedAllocations).reduce((s, v) => s + v, 0)
                const sumOthers = currentSum - amount
                const sliderMax = Math.max(0, maxBudget - sumOthers)

                return (
                  <motion.div 
                    key={plan.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="space-y-1.5"
                  >
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="font-bold text-[var(--text-secondary)]">{plan.name}</span>
                      <span className="font-mono font-bold text-[var(--text-primary)]">+{formatCurrency(amount)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input 
                        type="range"
                        min={0}
                        max={Math.max(sliderMax, amount)} 
                        step={5}
                        value={amount}
                        onChange={(e) => handleSliderChange(plan.id, parseFloat(e.target.value) || 0)}
                        className="flex-1 accent-[var(--color-primary)] h-1 bg-[var(--border-subtle)] rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </motion.div>
                )
              })}
            </div>

            <div className="flex justify-between items-center text-[10px] text-[var(--text-muted)] font-bold border-t border-[var(--border-subtle)] pt-3">
              <span>Allocato: <strong className="text-[var(--text-primary)]">{formatCurrency(totalAllocated)}</strong> / {formatCurrency(maxBudget)}</span>
              <button 
                onClick={resetToRecommended}
                className="text-[var(--color-primary)] hover:underline flex items-center gap-1 font-bold"
              >
                Reimposta consigliati
              </button>
            </div>

            <Button 
              variant="primary" 
              size="xs" 
              className="w-full mt-2 font-bold hover:scale-[1.01] active:scale-[0.99] transition-all"
              loading={applying}
              disabled={totalAllocated <= 0}
              onClick={handleApply}
            >
              Applica distribuzione
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}

export default SmartAdvicePanel
