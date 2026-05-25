import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useFinanceStore } from '@/store/useFinanceStore'
import { useAuthStore } from '@/store/useAuthStore'
import { useNotifications } from '@/hooks/useNotifications'
import { useAppStore } from '@/store/useAppStore'
import { getAccounts } from '@/lib/accounts'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { toast } from 'sonner'
import { format } from 'date-fns'


function TransactionModal({ isOpen, onClose, txToEdit = null }) {
  const { categories, addTransaction, updateTransaction, addCategory } = useFinanceStore()
  const { pushError, pushSuccess } = useNotifications()
  const { user } = useAuthStore()
  const { userConfig } = useAppStore()
  const accounts = getAccounts(userConfig)
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    amount: '',
    type: 'expense',
    category: '',
    payment_method: 'bank',
    target_account: 'cash',
    description: '',
  })

  useEffect(() => {
    const defaultMethod = accounts[0]?.id || 'bank'
    const defaultTarget = accounts[1]?.id || 'cash'
    
    if (txToEdit) {
      setFormData({
        date: txToEdit.date,
        amount: txToEdit.amount.toString(),
        type: txToEdit.type,
        category: txToEdit.category || '',
        payment_method: txToEdit.payment_method || defaultMethod,
        target_account: defaultTarget,
        description: txToEdit.description || '',
      })
    } else {
      setFormData({
        date: format(new Date(), 'yyyy-MM-dd'),
        amount: '',
        type: 'expense',
        category: categories.find(c => c.type === 'expense')?.id || '',
        payment_method: defaultMethod,
        target_account: defaultTarget,
        description: '',
      })
    }
  }, [txToEdit, isOpen, categories, userConfig])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (formData.type === 'transfer') {
        if (formData.payment_method === formData.target_account) {
          toast.error("Il conto di origine e destinazione devono essere diversi!")
          setLoading(false)
          return
        }

        // Cerca o crea la categoria Giroconto per Uscita ed Entrata
        let expenseCat = categories.find(c => c.name === 'Giroconto' && c.type === 'expense')
        let incomeCat = categories.find(c => c.name === 'Giroconto' && c.type === 'income')
        
        if (!expenseCat) {
          const { data, error } = await supabase.from('finance_categories').insert({
            name: 'Giroconto',
            type: 'expense',
            icon: 'arrow-right-left',
            color: '#7f8c8d',
            is_default: false
          }).select().single()
          if (error) throw error
          expenseCat = data
          addCategory(data)
        }
        
        if (!incomeCat) {
          const { data, error } = await supabase.from('finance_categories').insert({
            name: 'Giroconto',
            type: 'income',
            icon: 'arrow-right-left',
            color: '#7f8c8d',
            is_default: false
          }).select().single()
          if (error) throw error
          incomeCat = data
          addCategory(data)
        }

        const getAccountName = (key) => {
          const acc = accounts.find(a => a.id === key)
          return acc ? acc.name : 'Conto'
        }

        // 1. Crea l'uscita sul conto sorgente
        const expensePayload = {
          date: formData.date,
          amount: parseFloat(formData.amount),
          type: 'expense',
          category: expenseCat.id,
          payment_method: formData.payment_method,
          description: formData.description 
            ? `${formData.description.trim()} (Giroconto)`
            : `Giroconto a ${getAccountName(formData.target_account)}`,
          user_id: user?.id
        }
        const { data: expData, error: expErr } = await supabase.from('transactions').insert(expensePayload).select().single()
        if (expErr) throw expErr
        addTransaction(expData)

        // 2. Crea l'entrata sul conto target
        const incomePayload = {
          date: formData.date,
          amount: parseFloat(formData.amount),
          type: 'income',
          category: incomeCat.id,
          payment_method: formData.target_account,
          description: formData.description
            ? `${formData.description.trim()} (Giroconto)`
            : `Giroconto da ${getAccountName(formData.payment_method)}`,
          user_id: user?.id
        }
        const { data: incData, error: incErr } = await supabase.from('transactions').insert(incomePayload).select().single()
        if (incErr) throw incErr
        addTransaction(incData)

        toast.success('Giroconto registrato correttamente! 🔄')
        pushSuccess('Giroconto registrato', 'refresh-cw')
      } else {
        const payload = {
          date: formData.date,
          amount: parseFloat(formData.amount),
          type: formData.type,
          category: formData.category,
          payment_method: formData.payment_method,
          description: formData.description,
        }
        
        if (txToEdit) {
          const { data, error } = await supabase.from('transactions').update(payload).eq('id', txToEdit.id).select().single()
          if (error) throw error
          updateTransaction(txToEdit.id, data)
          toast.success('Transazione aggiornata')
          pushSuccess('Transazione aggiornata', 'edit')
        } else {
          const { data, error } = await supabase.from('transactions').insert({ ...payload, user_id: user?.id }).select().single()
          if (error) throw error
          addTransaction(data)
          toast.success('Transazione creata')
          pushSuccess('Transazione creata', 'plus')
        }
      }
      onClose()
    } catch (err) {
      console.error(err)
      pushError('Errore nel salvataggio')
    } finally {
      setLoading(false)
    }
  }

  const isExpense = formData.type === 'expense'
  const isTransfer = formData.type === 'transfer'

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={txToEdit ? 'Modifica Transazione' : 'Nuova Transazione'}
      className={isTransfer ? 'shimmer-transfer' : isExpense ? 'shimmer-expense' : 'shimmer-income'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Switcher dei Tipi transazione */}
        <div className="flex gap-1.5 bg-[var(--bg-base)] p-1 rounded-2xl border border-[var(--border-subtle)]">
          <button
            type="button"
            onClick={() => setFormData({ ...formData, type: 'expense' })}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              formData.type === 'expense'
                ? 'bg-[#e05252] text-white shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            Uscita
          </button>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, type: 'income' })}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              formData.type === 'income'
                ? 'bg-[#3d9970] text-white shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            Entrata
          </button>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, type: 'transfer' })}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
              formData.type === 'transfer'
                ? 'bg-indigo-500 text-white shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            Giroconto
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input 
            label="Data" 
            type="date" 
            required 
            value={formData.date} 
            onChange={e => setFormData({ ...formData, date: e.target.value })} 
          />
          <Input 
            label="Importo (€)" 
            type="number" 
            step="0.01" 
            required 
            placeholder="0.00"
            value={formData.amount} 
            onChange={e => setFormData({ ...formData, amount: e.target.value })} 
          />
        </div>

        {/* Nascondi la categoria per il Giroconto */}
        {!isTransfer && (
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[var(--text-secondary)]">Categoria</label>
            <select 
              className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-ghost)]"
              value={formData.category}
              onChange={e => setFormData({ ...formData, category: e.target.value })}
              required
            >
              <option value="" disabled>Seleziona categoria</option>
              {(() => {
                const seen = new Set();
                return categories
                  .filter(c => c.type === formData.type)
                  .filter(c => {
                    const key = `${c.name}-${c.type}`;
                    if (seen.has(key)) return false;
                    seen.add(key);
                    return true;
                  })
                  .map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ));
              })()}
            </select>
          </div>
        )}

        {/* Selettore dei Conti / Casse */}
        {!isTransfer ? (
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[var(--text-secondary)]">Conto / Cassa</label>
            <div className="grid grid-cols-2 gap-2">
              {accounts.map(acc => (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() => setFormData({ ...formData, payment_method: acc.id })}
                  className={`py-2 text-xs font-bold border rounded-[var(--radius-md)] transition-all ${
                    formData.payment_method === acc.id 
                      ? 'shadow-sm font-black' 
                      : 'border-[var(--border-subtle)] text-[var(--text-muted)] hover:border-[var(--text-primary)]'
                  }`}
                  style={{
                    backgroundColor: formData.payment_method === acc.id ? `${acc.color}15` : 'transparent',
                    borderColor: formData.payment_method === acc.id ? acc.color : 'var(--border-subtle)',
                    color: formData.payment_method === acc.id ? acc.color : 'var(--text-muted)'
                  }}
                >
                  {acc.name}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--text-secondary)]">Da Conto (Origine)</label>
              <select
                value={formData.payment_method}
                onChange={e => setFormData({ ...formData, payment_method: e.target.value })}
                className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-ghost)] font-bold text-[var(--text-primary)] cursor-pointer"
              >
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name}</option>
                ))}
              </select>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--text-secondary)]">A Conto (Destinazione)</label>
              <select
                value={formData.target_account}
                onChange={e => setFormData({ ...formData, target_account: e.target.value })}
                className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-[var(--radius-md)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-ghost)] font-bold text-[var(--text-primary)] cursor-pointer"
              >
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        <Input 
          label="Descrizione (opzionale)" 
          placeholder="Es: Spesa Esselunga o Giroconto mensile" 
          value={formData.description} 
          onChange={e => setFormData({ ...formData, description: e.target.value })} 
        />

        <div className="flex flex-col gap-2 pt-4">
          <Button 
            type="submit" 
            variant={isTransfer ? 'primary' : isExpense ? 'danger' : 'success'}
            loading={loading}
            size="lg"
            className="w-full shadow-lg font-black tracking-wide"
          >
            {txToEdit ? 'Aggiorna Transazione' : isTransfer ? 'Registra Giroconto' : 'Crea Transazione'}
          </Button>
          <Button variant="ghost" onClick={onClose} className="w-full text-[var(--text-muted)] font-bold">
            Annulla
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default TransactionModal
