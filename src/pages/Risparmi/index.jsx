import { useState, useMemo } from 'react'
import { useSavingsStore } from '@/store/useSavingsStore'
import Header from '@/components/layout/Header'
import PageWrapper from '@/components/layout/PageWrapper'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { Plus, PiggyBank, Sparkles } from 'lucide-react'
import PlanCard from './PlanCard'
import PlanModal from './PlanModal'
import SmartAdvicePanel from './SmartAdvicePanel'
import { formatCurrency } from '@/lib/formatters'

function Risparmi() {
  const { plans, loading } = useSavingsStore()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState(null)

  const totals = useMemo(() => {
    const total = plans.reduce((s, p) => s + parseFloat(p.current_amount || 0), 0)
    const target = plans.reduce((s, p) => s + parseFloat(p.target_amount || 0), 0)
    return { total, target, progress: target > 0 ? (total / target) * 100 : 0 }
  }, [plans])

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
        <div className="space-y-4 lg:h-full flex flex-col lg:overflow-hidden">
          {/* Summary Hero */}
          <Card padding="lg" className="bg-gradient-to-br from-[var(--color-primary)] to-[#3d9970] text-white border-0 shadow-lg shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">Totale Risparmiato</p>
                <h2 className="text-3xl font-bold">{formatCurrency(totals.total)}</h2>
                <div className="flex items-center gap-2 mt-2">
                  <div className="h-1.5 w-32 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-white" style={{ width: `${totals.progress}%` }} />
                  </div>
                  <span className="text-[10px] font-bold">{totals.progress.toFixed(1)}% del target totale</span>
                </div>
              </div>
              <PiggyBank size={48} className="opacity-20" />
            </div>
          </Card>

          <div className="flex-1 min-h-0 lg:grid lg:grid-cols-3 lg:gap-6 lg:space-y-0 space-y-6">
            {/* Left/Middle Columns: Plans List */}
            <div className="lg:col-span-2 flex flex-col lg:h-full min-h-0 order-2 lg:order-1">
              <h3 className="text-sm font-bold text-[var(--text-primary)] mb-4 px-1">I tuoi Obiettivi</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:overflow-y-auto pr-1 pb-4">
                {plans.map(plan => (
                  <PlanCard 
                    key={plan.id} 
                    plan={plan} 
                    onEdit={() => { setEditingPlan(plan); setModalOpen(true) }} 
                  />
                ))}
                {plans.length === 0 && (
                  <div className="col-span-2 text-center py-12 opacity-40">
                    <PiggyBank size={40} className="mx-auto mb-2" />
                    <p className="text-xs font-bold">Inizia a risparmiare oggi!</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Smart Advice */}
            <div className="order-1 lg:order-2">
              <SmartAdvicePanel />
            </div>
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
