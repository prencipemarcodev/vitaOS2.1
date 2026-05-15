import { useState, useMemo } from 'react'
import { PiggyBank, Plus, Minus, CreditCard, Banknote } from 'lucide-react'
import { formatCurrency } from '@/lib/formatters'
import { useSavingsStore } from '@/store/useSavingsStore'
import { useFinanceStore } from '@/store/useFinanceStore'
import { useNotifications } from '@/hooks/useNotifications'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import Card from '@/components/ui/Card'
import clsx from 'clsx'

function FreeSavingsCard() {
  const { plans, updatePlan, addMovement } = useSavingsStore()
  const { categories, addTransaction } = useFinanceStore()
  const { pushError } = useNotifications()

  // Trova il salvadanaio libero o crealo virtualmente se non esiste
  const freePlan = useMemo(() => 
    plans.find(p => p.type === 'piggy_bank') || { 
      name: 'Salvadanaio Libero', 
      current_amount: 0, 
      type: 'piggy_bank',
      id: 'free_piggy_bank' 
    }
  , [plans])

  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('bank') // 'bank' o 'cash'
  const [loading, setLoading] = useState(false)

  const handleAction = async (type) => {
    const val = parseFloat(amount)
    if (isNaN(val) || val <= 0) return toast.error('Inserisci un importo valido')
    
    setLoading(true)
    const adjustment = type === 'deposit' ? val : -val
    const newAmount = Math.max(0, parseFloat(freePlan.current_amount || 0) + adjustment)

    try {
      let targetPlan = freePlan
      
      // Se il piano non esiste nel DB, lo creiamo al primo movimento
      if (freePlan.id === 'free_piggy_bank') {
        const { data, error } = await supabase
          .from('saving_plans')
          .insert({
            name: 'Salvadanaio Libero',
            type: 'piggy_bank',
            current_amount: adjustment,
            target_amount: 0,
            icon: 'PiggyBank'
          })
          .select()
          .single()
        if (error) throw error
        targetPlan = data
        // Nota: lo store verrà aggiornato tramite il setPlans nel componente padre o refetch
      } else {
        const { data, error } = await supabase
          .from('saving_plans')
          .update({ current_amount: newAmount })
          .eq('id', freePlan.id)
          .select()
          .single()
        if (error) throw error
        updatePlan(freePlan.id, data)
      }

      // 1. Registra movimento risparmio
      const { data: movement } = await supabase
        .from('saving_movements')
        .insert({
          plan_id: targetPlan.id,
          amount: adjustment,
          type: type,
          date: new Date().toISOString().split('T')[0]
        })
        .select()
        .single()
      if (movement) addMovement(movement)

      // 2. Crea transazione finanziaria sincronizzata
      const savingsCategory = categories.find(c => c.name.toLowerCase().includes('risparmi'))
      const { data: tx } = await supabase
        .from('transactions')
        .insert({
          amount: val,
          type: type === 'deposit' ? 'expense' : 'income',
          category: savingsCategory?.name || 'Risparmio',
          description: type === 'deposit' ? 'Risparmio generico (Salvadanaio)' : 'Prelievo da Salvadanaio',
          payment_method: method,
          date: new Date().toISOString().split('T')[0]
        })
        .select()
        .single()
      
      if (tx) addTransaction(tx)

      toast.success(type === 'deposit' ? 'Spiccioli messi da parte! 🐷' : 'Fondi prelevati')
      setAmount('')
    } catch (err) {
      console.error(err)
      pushError('Errore nel salvataggio')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card padding="md" className="bg-white border-2 border-dashed border-[#9b59b6]/30 relative overflow-hidden group">
      <div className="absolute -right-4 -top-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
        <PiggyBank size={120} className="text-[#9b59b6]" />
      </div>

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-[#9b59b6]/10 flex items-center justify-center text-[#9b59b6]">
            <PiggyBank size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-tight">Salvadanaio Libero</h3>
            <p className="text-xl font-black text-[#9b59b6] leading-none mt-0.5">{formatCurrency(freePlan.current_amount)}</p>
          </div>
        </div>

        <div className="space-y-3">
          {/* Input Importo */}
          <div className="flex items-center gap-2 bg-[var(--bg-base)] p-1.5 rounded-xl border border-[var(--border-subtle)] focus-within:border-[#9b59b6] transition-colors">
            <input 
              type="number" 
              placeholder="Importo €"
              className="flex-1 bg-transparent border-0 text-sm font-bold px-2 focus:ring-0 placeholder:font-normal"
              value={amount}
              onChange={e => setAmount(e.target.value)}
            />
          </div>

          {/* Selettore Metodo */}
          <div className="flex gap-1 p-1 bg-[var(--bg-base)] rounded-xl border border-[var(--border-subtle)]">
            <button 
              onClick={() => setMethod('bank')}
              className={clsx(
                "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-bold transition-all",
                method === 'bank' ? "bg-white shadow-sm text-[var(--color-primary)]" : "text-[var(--text-muted)] hover:bg-black/5"
              )}
            >
              <CreditCard size={12} />
              CONTO
            </button>
            <button 
              onClick={() => setMethod('cash')}
              className={clsx(
                "flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-bold transition-all",
                method === 'cash' ? "bg-white shadow-sm text-orange-600" : "text-[var(--text-muted)] hover:bg-black/5"
              )}
            >
              <Banknote size={12} />
              CONTANTI
            </button>
          </div>

          {/* Azioni */}
          <div className="flex gap-2">
            <button 
              onClick={() => handleAction('withdrawal')}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[var(--border-subtle)] text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:bg-black/5 active:scale-95 transition-all"
            >
              <Minus size={14} />
              Preleva
            </button>
            <button 
              onClick={() => handleAction('deposit')}
              disabled={loading}
              className="flex-[1.5] flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#9b59b6] text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-[#9b59b6]/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
            >
              <Plus size={14} />
              Deposita
            </button>
          </div>
        </div>
      </div>
    </Card>
  )
}

export default FreeSavingsCard
