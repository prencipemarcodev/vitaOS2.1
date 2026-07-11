import { useMemo, useState } from 'react'
import clsx from 'clsx'
import { Edit2, Trash2, Plus, Vault } from 'lucide-react'
import { formatCurrency } from '@/lib/formatters'
import { supabase } from '@/lib/supabase'
import { useSavingsStore } from '@/store/useSavingsStore'
import { useNotifications } from '@/hooks/useNotifications'
import { useAuthStore } from '@/store/useAuthStore'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { useConfirmStore } from '@/store/useConfirmStore'
import { useFinanceStore } from '@/store/useFinanceStore'
import { useAppStore } from '@/store/useAppStore'
import { useNotificationStore } from '@/store/useNotificationStore'
import { getAccounts } from '@/lib/accounts'

export default function EmergencyFundCard({ plan, onEdit, advice = null }) {
  const confirm = useConfirmStore(s => s.confirm)
  const { updatePlan, removePlan, addMovement } = useSavingsStore()
  const { transactions, categories, addTransaction, setCumulativeBalance, cumulativeBalance } = useFinanceStore()
  const { userConfig } = useAppStore()
  const { addNotification } = useNotificationStore()
  const { pushError } = useNotifications()
  const { user } = useAuthStore()

  const [customAmount, setCustomAmount] = useState('')
  const [method, setMethod] = useState(() => {
    const accounts = getAccounts(userConfig)
    return accounts[0]?.id || 'bank'
  })
  const [isExpanded, setIsExpanded] = useState(false)

  // Saldo totale del conto
  const saldoDisponibile = useMemo(() => {
    const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount || 0), 0)
    const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount || 0), 0)
    const accounts = getAccounts(userConfig)
    const baseBalance = accounts.reduce((sum, acc) => sum + parseFloat(acc.initial_balance || 0), 0)
    return baseBalance + income - expense
  }, [transactions, userConfig])

  const handleAdjust = async (type) => {
    const amount = parseFloat(customAmount)
    if (isNaN(amount) || amount <= 0) {
      toast.error('Inserisci una cifra valida')
      return
    }

    const multiplier = type === 'deposit' ? 1 : -1
    const adjustment = amount * multiplier
    const newAmount = Math.max(0, parseFloat(plan.current_amount || 0) + adjustment)
    
    if (type === 'deposit' && amount > saldoDisponibile) {
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

      // 1. Inserisci il movimento in Supabase
      const { data: movement } = await supabase
        .from('saving_movements')
        .insert({
          user_id: user?.id,
          plan_id: plan.id,
          amount: adjustment,
          type: type,
          date: today
        })
        .select()
        .single()
      if (movement) addMovement(movement)

      // 2. Registra la transazione finanziaria correlata
      let savingsCategory = categories.find(c => c.name.toLowerCase().includes('risparmi'))
      
      const { data: tx } = await supabase
        .from('transactions')
        .insert({
          user_id: user?.id,
          amount: amount,
          type: type === 'deposit' ? 'expense' : 'income',
          category: savingsCategory?.name || 'Risparmio',
          description: type === 'deposit' ? `Accantonamento: ${plan.name}` : `Prelievo da: ${plan.name}`,
          payment_method: method,
          date: today
        })
        .select()
        .single()
      
      if (tx) {
        addTransaction(tx)
        const delta = type === 'deposit' ? -amount : amount
        setCumulativeBalance(cumulativeBalance + delta)
      }
      
      toast.success(type === 'deposit' ? `Depositati ${formatCurrency(amount)}` : `Prelevati ${formatCurrency(amount)}`)
      setCustomAmount('')
      setIsExpanded(false)

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
    const accumulated = parseFloat(plan.current_amount || 0)
    const ok = await confirm({
      title: 'Elimina piano',
      message: accumulated > 0
        ? `Vuoi eliminare il fondo "${plan.name}"? Tutti i risparmi accantonati (${formatCurrency(accumulated)}) verranno riaccreditati sul tuo saldo.`
        : `Vuoi eliminare il fondo "${plan.name}"?`,
      variant: 'danger',
      confirmText: 'Elimina',
      cancelText: 'Annulla'
    })
    if (!ok) return

    try {
      // 1. Elimina il piano dal DB
      const { error } = await supabase.from('saving_plans').delete().eq('id', plan.id).eq('user_id', user?.id)
      if (error) throw error

      // 2. Se c'era del saldo accumulato (> 0), creiamo una transazione di riaccredito (Entrata / "+")
      if (accumulated > 0) {
        const today = new Date().toISOString().split('T')[0]
        const savingsCategory = categories.find(c => c.name.toLowerCase().includes('risparmi'))
        
        const { data: tx } = await supabase
          .from('transactions')
          .insert({
            user_id: user?.id,
            amount: accumulated,
            type: 'income', // Riaccredito come entrata (+)
            category: savingsCategory?.name || 'Risparmio',
            description: `Riaccredito saldo per eliminazione fondo: ${plan.name}`,
            payment_method: 'bank',
            date: today
          })
          .select()
          .single()

        if (tx) {
          addTransaction(tx)
          setCumulativeBalance(cumulativeBalance + accumulated)
        }
      }

      removePlan(plan.id)
      toast.success(accumulated > 0 ? 'Fondo eliminato e saldo riaccreditato!' : 'Fondo eliminato')
    } catch (err) {
      console.error(err)
      pushError("Errore nell'eliminazione del fondo")
    }
  }

  return (
    <div className="group relative bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-subtle)] dark:bg-gradient-to-br dark:from-[#241D16] dark:to-[#18140F] dark:text-[#EFE9DD] dark:border-stone-800/40 rounded-[var(--radius-lg)] p-6 mb-6 shadow-md transition-all hover:shadow-lg">
      {/* Edit/Delete icons */}
      <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button onClick={onEdit} className="p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--color-primary)] dark:hover:bg-stone-800 dark:hover:text-white transition-colors">
          <Edit2 size={13} />
        </button>
        <button onClick={handleDelete} className="p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--color-danger)] dark:hover:bg-stone-800 dark:hover:text-[var(--color-danger)] transition-colors">
          <Trash2 size={13} />
        </button>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-950/20 flex items-center justify-center flex-shrink-0 border border-purple-200 dark:border-purple-500/20">
            <Vault size={24} className="text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--text-primary)] dark:text-white leading-snug">{plan.name || 'Fondo di Emergenza'}</h3>
            <p className="text-[11px] text-[var(--text-secondary)] dark:text-stone-400 mt-1 max-w-[340px] italic">
              "Salvadanaio libero: metti da parte quello che puoi, senza fretta."
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6 justify-between md:justify-end">
          <div className="text-left md:text-right">
            <span className="text-xs text-[var(--text-muted)] dark:text-stone-500 uppercase tracking-wider block">Saldo attuale</span>
            <span className="font-display text-xl font-medium text-[var(--text-primary)] dark:text-white">{formatCurrency(plan.current_amount)}</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold tracking-wide uppercase px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/30">
              Emergenza
            </span>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={clsx(
                "w-7 h-7 rounded-lg bg-[var(--color-primary)] hover:opacity-90 active:scale-95 text-white flex items-center justify-center shadow-sm transition-all",
                isExpanded && "bg-stone-700 dark:bg-stone-800"
              )}
            >
              <Plus size={14} className={clsx("transition-transform duration-200", isExpanded && "rotate-45")} />
            </button>
          </div>
        </div>
      </div>

      {/* Expanded panel for deposit/withdrawal */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden mt-6 pt-4 border-t border-[var(--border-subtle)] dark:border-stone-800 space-y-4 max-w-md"
          >
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Account toggle */}
              <div className="flex border border-[var(--border-subtle)] dark:border-stone-800 rounded-lg overflow-hidden flex-1 bg-[var(--bg-base)] dark:bg-stone-900/60 p-[2px]">
                {getAccounts(userConfig).map(acc => (
                  <button 
                    key={acc.id}
                    type="button"
                    className={clsx(
                      "flex-1 text-center text-[10px] py-1.5 font-bold rounded-md transition-all uppercase whitespace-nowrap px-1.5",
                      method === acc.id 
                        ? "bg-white dark:bg-stone-800 text-[var(--text-primary)] dark:text-white shadow-sm" 
                        : "text-[var(--text-muted)] dark:text-stone-500 hover:text-[var(--text-secondary)] dark:hover:text-stone-300"
                    )}
                    style={{
                      color: method === acc.id ? acc.color : undefined
                    }}
                    onClick={() => setMethod(acc.id)}
                  >
                    {acc.name}
                  </button>
                ))}
              </div>

              {/* Input quota */}
              <div className="flex items-center gap-2 bg-[var(--bg-base)] dark:bg-stone-900/60 p-1.5 rounded-xl border border-[var(--border-subtle)] dark:border-stone-800 flex-1">
                <input 
                  type="number" 
                  placeholder="Quota €"
                  className="flex-1 bg-transparent border-0 text-xs font-bold px-2 focus:ring-0 placeholder:text-[var(--text-muted)] dark:placeholder:text-stone-600 text-[var(--text-primary)] dark:text-white"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                />
                {customAmount && (
                  <button 
                    type="button" 
                    onClick={() => setCustomAmount('')}
                    className="text-[9px] font-bold text-[var(--text-muted)] dark:text-stone-500 hover:text-[var(--text-secondary)] dark:hover:text-stone-300 px-2"
                  >
                    Cancella
                  </button>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                type="button"
                onClick={() => handleAdjust('withdrawal')}
                className="flex-1 py-2 rounded-xl text-xs font-bold border border-[var(--color-danger)] dark:border-red-500/50 text-[var(--color-danger)] dark:text-red-400 hover:bg-[var(--color-danger-ghost)] dark:hover:bg-red-500/10 transition-colors"
              >
                Preleva dal fondo
              </button>
              <button 
                type="button"
                onClick={() => handleAdjust('deposit')}
                className="flex-1 py-2 rounded-xl text-xs font-bold bg-[var(--color-primary)] text-white hover:opacity-90 transition-opacity"
              >
                Deposita nel fondo
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
