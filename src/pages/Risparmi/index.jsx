import { useState, useMemo } from 'react'
import { useSavingsStore } from '@/store/useSavingsStore'
import { useFinanceStore } from '@/store/useFinanceStore'
import { useAppStore } from '@/store/useAppStore'
import Header from '@/components/layout/Header'
import PageWrapper from '@/components/layout/PageWrapper'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { Plus, Sparkles, TrendingUp } from 'lucide-react'
import PlanCard from './PlanCard'
import EmergencyFundCard from './EmergencyFundCard'
import PlanTimeline from './PlanTimeline'
import PlanModal from './PlanModal'
import { formatCurrency } from '@/lib/formatters'
import { calculateSmartAdvice } from '@/lib/smartSavings'

function Risparmi() {
  const { plans } = useSavingsStore()
  const { transactions, cumulativeBalance } = useFinanceStore()
  const { userConfig, selectedMonth } = useAppStore()

  const [modalOpen, setModalOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState(null)

  // Filtra piani attivi
  const activePlans = useMemo(() => {
    return plans.filter(p => p.is_active !== false)
  }, [plans])

  const totals = useMemo(() => {
    const total = activePlans.reduce((s, p) => s + parseFloat(p.current_amount || 0), 0)
    const target = activePlans.reduce((s, p) => s + parseFloat(p.target_amount || 0), 0)
    return { total, target, progress: target > 0 ? (total / target) * 100 : 0 }
  }, [activePlans])

  // Calcolo Smart Advice e Stato Salute Finanziaria
  const advice = useMemo(() => {
    return calculateSmartAdvice({ 
      userConfig, 
      transactions, 
      plans: activePlans, 
      selectedMonth,
      totalBalance: cumulativeBalance
    })
  }, [userConfig, transactions, activePlans, selectedMonth, cumulativeBalance])

  // Suddivisione piani in Obiettivi e Salvadanai (Fondi Emergenza)
  const piggyBanks = useMemo(() => {
    return activePlans.filter(p => p.type === 'piggy_bank')
  }, [activePlans])

  const goals = useMemo(() => {
    return activePlans.filter(p => p.type === 'goal')
  }, [activePlans])

  // Ordinati per scadenza (gli obiettivi senza scadenza vanno in coda)
  const sortedGoals = useMemo(() => {
    return [...goals].sort((a, b) => {
      if (!a.target_date && !b.target_date) return 0
      if (!a.target_date) return 1
      if (!b.target_date) return -1
      return new Date(a.target_date).getTime() - new Date(b.target_date).getTime()
    })
  }, [goals])

  // Percentuale della barra di salute finanziaria
  const liquidityProgress = useMemo(() => {
    if (!advice?.safetyThreshold || advice.safetyThreshold <= 0) return 100
    return Math.min(100, (cumulativeBalance / advice.safetyThreshold) * 100)
  }, [cumulativeBalance, advice?.safetyThreshold])

  // Valori per la salute finanziaria ring/barra
  const ringCircumference = 2 * Math.PI * 33 // r=33 -> ~207.35
  const ringOffset = ringCircumference - (totals.progress / 100) * ringCircumference

  return (
    <>
      <Header 
        title="Risparmi" 
        showNotification 
        actions={
          <Button 
            variant="ghost" 
            size="sm" 
            icon={Plus} 
            onClick={() => { setEditingPlan(null); setModalOpen(true) }}
            className="font-bold !text-sm"
            style={{ fontFamily: 'var(--font-display)' }}
            hideTextMobile
          >
            Nuovo Obiettivo
          </Button>
        }
      />

      <PageWrapper>
        <div className="space-y-6 pb-12 lg:h-full lg:overflow-y-auto pr-1">
          
          {/* STATUS STRIP */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Totale Risparmiato Card */}
            <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] p-5 shadow-[var(--shadow-sm)] flex items-center gap-6">
              <div className="relative w-[78px] h-[78px] flex-shrink-0">
                <svg className="absolute inset-0 -rotate-95" width="78" height="78" viewBox="0 0 78 78">
                  <circle cx="39" cy="39" r="33" fill="none" stroke="var(--border-subtle)" strokeWidth="6" />
                  <circle 
                    cx="39" 
                    cy="39" 
                    r="33" 
                    fill="none" 
                    stroke="var(--color-primary)" 
                    strokeWidth="6" 
                    strokeDasharray={ringCircumference}
                    strokeDashoffset={ringOffset}
                    strokeLinecap="round"
                    className="transition-all duration-[var(--transition-slow)]"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-[var(--color-primary-dark)]">
                  {totals.progress.toFixed(0)}%
                </div>
              </div>
              <div>
                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider block">Totale risparmiato</span>
                <h2 className="font-display text-2xl font-bold text-[var(--text-primary)] mt-1">{formatCurrency(totals.total)}</h2>
                <p className="text-[11px] text-[var(--text-secondary)] mt-1 font-medium">
                  su {formatCurrency(totals.target)} di obiettivi attivi
                </p>
              </div>
            </div>

            {/* Salute Finanziaria Card */}
            {advice && (
              <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] p-5 shadow-[var(--shadow-sm)] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">Salute finanziaria</h3>
                    <Badge variant={advice.liquidityStatus.color} className="text-[9px] font-bold uppercase tracking-wider py-0.5 px-2">
                      {advice.liquidityStatus.color === 'success' && 'Sicura'}
                      {advice.liquidityStatus.color === 'warning' && 'Attenzione'}
                      {advice.liquidityStatus.color === 'danger' && 'Critica'}
                    </Badge>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="h-2 bg-[var(--border-subtle)] rounded-full overflow-hidden mb-2">
                    <div 
                      className="h-full rounded-full transition-all duration-[var(--transition-slow)]" 
                      style={{ 
                        width: `${liquidityProgress}%`,
                        backgroundColor: advice.liquidityStatus.color === 'success' ? 'var(--color-success)' :
                                         advice.liquidityStatus.color === 'warning' ? 'var(--color-warning)' :
                                         'var(--color-danger)'
                      }}
                    />
                  </div>

                  <div className="flex justify-between text-[11px] text-[var(--text-secondary)] font-medium mb-3">
                    <span>Soglia sicurezza <strong>{formatCurrency(advice.safetyThreshold)}</strong></span>
                    <span>Saldo attuale <strong>{formatCurrency(cumulativeBalance)}</strong></span>
                  </div>
                </div>

                <div className="flex gap-2 bg-[var(--color-primary-ghost)] border border-[var(--color-primary)]/10 rounded-xl p-3 text-[11px] text-[var(--color-primary-dark)] leading-normal italic font-medium">
                  <Sparkles size={14} className="flex-shrink-0 mt-0.5 text-[var(--color-primary)]" />
                  <span>{advice.coachAdvice}</span>
                </div>
              </div>
            )}
          </div>

          {/* TIMELINE */}
          <PlanTimeline plans={activePlans} advice={advice} />

          {/* FONDO EMERGENZA */}
          {piggyBanks.length > 0 && (
            <div>
              <div className="flex items-baseline justify-between mb-3 px-1">
                <h3 className="font-display text-base font-semibold text-[var(--text-primary)]">Fondo di emergenza</h3>
              </div>
              <div className="space-y-4">
                {piggyBanks.map(pb => (
                  <EmergencyFundCard
                    key={pb.id}
                    plan={pb}
                    advice={advice}
                    onEdit={() => { setEditingPlan(pb); setModalOpen(true) }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* OBIETTIVI */}
          <div>
            <div className="flex items-baseline justify-between mb-4 px-1">
              <h3 className="font-display text-base font-semibold text-[var(--text-primary)]">I tuoi obiettivi</h3>
              <span className="text-xs text-[var(--text-secondary)] font-medium">Ordinati per scadenza</span>
            </div>

            {sortedGoals.length === 0 ? (
              <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] p-8 text-center text-xs text-[var(--text-muted)]">
                Nessun obiettivo attivo. Clicca su "+ Nuovo Obiettivo" in alto per iniziare.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {sortedGoals.map(plan => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    advice={advice}
                    onEdit={() => { setEditingPlan(plan); setModalOpen(true) }}
                  />
                ))}
              </div>
            )}
          </div>

        </div>
      </PageWrapper>

      <PlanModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        planToEdit={editingPlan} 
      />
    </>
  )
}

export default Risparmi
