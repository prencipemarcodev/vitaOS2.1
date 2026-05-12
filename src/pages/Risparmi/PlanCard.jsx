import { Edit2, Trash2, Plus, Minus } from 'lucide-react'
import { formatCurrency } from '@/lib/formatters'
import { supabase } from '@/lib/supabase'
import { useSavingsStore } from '@/store/useSavingsStore'
import { useNotifications } from '@/hooks/useNotifications'
import { toast } from 'sonner'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { motion } from 'framer-motion'
import Button from '@/components/ui/Button'

function PlanCard({ plan, onEdit }) {
  const { updatePlan, removePlan, addMovement } = useSavingsStore()
  const { pushError } = useNotifications()
  const progress = Math.min(100, (plan.current_amount / plan.target_amount) * 100)

  const handleAdjust = async (amount) => {
    const newAmount = Math.max(0, parseFloat(plan.current_amount || 0) + amount)
    try {
      const { data: updated, error } = await supabase
        .from('saving_plans')
        .update({ current_amount: newAmount })
        .eq('id', plan.id)
        .select()
        .single()
      if (error) throw error
      
      updatePlan(plan.id, updated)
      
      // Log movement
      const { data: movement } = await supabase
        .from('saving_movements')
        .insert({
          plan_id: plan.id,
          amount: amount,
          type: amount > 0 ? 'deposit' : 'withdrawal',
          date: new Date().toISOString().split('T')[0]
        })
        .select()
        .single()
      if (movement) addMovement(movement)
      
      toast.success(amount > 0 ? `Depositati €${amount}` : `Prelevati €${Math.abs(amount)}`)
    } catch (err) {
      pushError('Errore nell\'aggiornamento')
    }
  }

  const handleDelete = async () => {
    if (!confirm('Eliminare questo piano?')) return
    const { error } = await supabase.from('saving_plans').delete().eq('id', plan.id)
    if (!error) {
      removePlan(plan.id)
      toast.success('Piano eliminato')
    }
  }

  return (
    <Card padding="md" className="group relative overflow-hidden">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-3xl bg-[var(--bg-base)] w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm border border-[var(--border-subtle)]">
            {plan.icon || '🎯'}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="font-bold text-[var(--text-primary)]">{plan.name}</h3>
              {plan.priority === 3 && <Badge variant="danger" className="text-[7px] px-1 py-0 uppercase">Priorità Alta</Badge>}
            </div>
            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
              {formatCurrency(plan.current_amount)} / {formatCurrency(plan.target_amount)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onEdit} className="p-2 text-[var(--text-muted)] hover:text-[var(--color-primary)]">
            <Edit2 size={14} />
          </button>
          <button onClick={handleDelete} className="p-2 text-[var(--text-muted)] hover:text-[var(--color-danger)]">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-[10px] font-bold">
          <span className="text-[var(--color-primary)]">{progress.toFixed(1)}% completato</span>
          <span className="text-[var(--text-muted)]">Rimanenti: {formatCurrency(plan.target_amount - plan.current_amount)}</span>
        </div>
        <div className="h-2 bg-[var(--bg-base)] rounded-full overflow-hidden border border-[var(--border-subtle)]">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="h-full bg-[var(--color-primary)]"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button 
          variant="ghost" 
          size="sm" 
          className="flex-1 text-[10px] font-bold border border-[var(--border-subtle)] h-8"
          onClick={() => handleAdjust(-50)}
          icon={Minus}
        >
          50€
        </Button>
        <Button 
          variant="primary" 
          size="sm" 
          className="flex-1 text-[10px] font-bold h-8"
          onClick={() => handleAdjust(50)}
          icon={Plus}
        >
          50€
        </Button>
      </div>
    </Card>
  )
}

export default PlanCard
