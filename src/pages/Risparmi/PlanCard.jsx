import { useMemo, useState } from 'react'
import clsx from 'clsx'
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
import { getIcon } from '@/lib/icons'

import { useFinanceStore } from '@/store/useFinanceStore'
import { useAppStore } from '@/store/useAppStore'
import { useNotificationStore } from '@/store/useNotificationStore'
import { differenceInMonths, parseISO, startOfMonth } from 'date-fns'
import PACChart from './PACChart'

function PlanCard({ plan, onEdit }) {
  const { updatePlan, removePlan, addMovement, movements } = useSavingsStore()
  const { transactions, categories, addTransaction } = useFinanceStore()
  const { userConfig } = useAppStore()
  const { addNotification } = useNotificationStore()
  const { pushError } = useNotifications()

  // Filtra movimenti per questo piano
  const planMovements = useMemo(() => 
    movements.filter(m => m.plan_id === plan.id),
  [movements, plan.id])
  
  const isGoal = plan.type !== 'piggy_bank'
  const progress = isGoal ? Math.min(100, (plan.current_amount / plan.target_amount) * 100) : 0
  const Icon = getIcon(plan.icon)

  // Calcolo Performance PAC
  const performance = useMemo(() => {
    if (!isGoal || !plan.target_date || !plan.created_at) return null
    
    const start = parseISO(plan.created_at)
    const end = parseISO(plan.target_date)
    const today = new Date()
    
    const totalMonths = Math.max(1, differenceInMonths(end, start))
    const monthsPassed = Math.max(0, differenceInMonths(today, start))
    
    const idealCurrent = (plan.target_amount / totalMonths) * monthsPassed
    const diff = plan.current_amount - idealCurrent
    
    if (diff < -50) return { label: 'Sotto Target', color: 'danger', icon: 'AlertCircle' }
    if (diff > 50) return { label: 'Eccellente', color: 'success', icon: 'TrendingUp' }
    return { label: 'In Linea', color: 'primary', icon: 'Check' }
  }, [plan, isGoal])

  // Calcolo saldo totale disponibile
  const saldo = useMemo(() => {
    const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount || 0), 0)
    const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount || 0), 0)
    const bankBase = parseFloat(userConfig?.initial_bank_balance) || 0
    const cashBase = parseFloat(userConfig?.initial_cash_balance) || 0
    return bankBase + cashBase + income - expense
  }, [transactions, userConfig])

  const canDeposit = saldo >= 50

  const [customAmount, setCustomAmount] = useState('')

  const handleAdjust = async (type) => {
    const amount = parseFloat(customAmount)
    if (isNaN(amount) || amount <= 0) {
      toast.error('Inserisci una cifra valida')
      return
    }

    const multiplier = type === 'deposit' ? 1 : -1
    const adjustment = amount * multiplier
    const newAmount = Math.max(0, parseFloat(plan.current_amount || 0) + adjustment)
    
    if (type === 'deposit' && amount > saldo) {
      toast.error('Saldo insufficiente per questo deposito')
      return
    }

    try {
      const { data: updated, error } = await supabase
        .from('saving_plans')
        .update({ current_amount: newAmount })
        .eq('id', plan.id)
        .select()
        .single()
      if (error) throw error
      
      updatePlan(plan.id, updated)
      
      const today = new Date().toISOString().split('T')[0]

      // 1. Log saving movement
      const { data: movement } = await supabase
        .from('saving_movements')
        .insert({
          plan_id: plan.id,
          amount: adjustment,
          type: type,
          date: today
        })
        .select()
        .single()
      if (movement) addMovement(movement)

      // 2. Log finance transaction (Syncing with balance)
      // Cerchiamo la categoria "Risparmi"
      let savingsCategory = categories.find(c => c.name.toLowerCase().includes('risparmi'))
      
      const { data: tx } = await supabase
        .from('transactions')
        .insert({
          amount: amount,
          type: type === 'deposit' ? 'expense' : 'income',
          category_id: savingsCategory?.id || categories[0]?.id,
          description: type === 'deposit' ? `Accantonamento: ${plan.name}` : `Prelievo da: ${plan.name}`,
          date: today
        })
        .select()
        .single()
      
      if (tx) {
        addTransaction(tx)
      }
      
      toast.success(type === 'deposit' ? `Depositati ${formatCurrency(amount)}` : `Prelevati ${formatCurrency(amount)}`)
      setCustomAmount('')

      addNotification({
        title: type === 'deposit' ? 'Deposito Risparmi' : 'Prelievo Risparmi',
        message: type === 'deposit' 
          ? `Hai aggiunto ${formatCurrency(amount)} a "${plan.name}" e registrato l'uscita nelle finanze.`
          : `Hai prelevato ${formatCurrency(amount)} da "${plan.name}" e registrato l'entrata nelle finanze.`,
        type: type === 'deposit' ? 'success' : 'info',
        icon: 'PiggyBank'
      })
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
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className={clsx(
            "w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm border",
            plan.type === 'piggy_bank' ? "bg-[rgba(155,89,182,0.1)] border-[rgba(155,89,182,0.2)]" : "bg-[var(--bg-base)] border-[var(--border-subtle)]"
          )}>
            <Icon size={24} className={plan.type === 'piggy_bank' ? "text-[#9b59b6]" : "text-[var(--color-primary)]"} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="font-bold text-[var(--text-primary)] leading-tight">{plan.name}</h3>
              {performance && (
                <Badge variant={performance.color} className="text-[7px] px-1 py-0 uppercase">
                  {performance.label}
                </Badge>
              )}
              {plan.priority === 3 && plan.type !== 'piggy_bank' && <Badge variant="danger" className="text-[7px] px-1 py-0 uppercase">Priorità Alta</Badge>}
            </div>
            <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
              {formatCurrency(plan.current_amount)}
              {isGoal && ` / ${formatCurrency(plan.target_amount)}`}
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

      {/* Chart PAC */}
      <PACChart plan={plan} movements={planMovements} />

      {isGoal && (
        <div className="space-y-2 my-4">
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
      )}

      {plan.type === 'piggy_bank' && (
        <div className="my-4 py-2 border-t border-b border-[var(--border-subtle)] border-dashed">
          <p className="text-[10px] text-center text-[var(--text-muted)] italic font-medium">
            "Salvadanaio libero: metti da parte quello che puoi, senza fretta."
          </p>
        </div>
      )}

      <div className="flex items-center gap-2 mt-2 bg-[var(--bg-base)] p-1.5 rounded-2xl border border-[var(--border-subtle)]">
        <input 
          type="number" 
          placeholder="Quota €"
          className="flex-1 bg-transparent border-0 text-xs font-bold px-2 focus:ring-0 placeholder:text-[var(--text-muted)] placeholder:font-normal"
          value={customAmount}
          onChange={(e) => setCustomAmount(e.target.value)}
        />
        <div className="flex gap-1">
          <button 
            onClick={() => handleAdjust('withdrawal')}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--color-danger-ghost)] hover:text-[var(--color-danger)] transition-colors"
            title="Preleva"
          >
            <Minus size={16} />
          </button>
          <button 
            onClick={() => handleAdjust('deposit')}
            className="w-8 h-8 rounded-xl bg-[var(--color-primary)] text-white flex items-center justify-center shadow-sm hover:scale-105 active:scale-95 transition-all"
            title="Deposita"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>
    </Card>
  )
}

export default PlanCard
