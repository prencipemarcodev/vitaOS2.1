import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useFinanceStore } from '@/store/useFinanceStore'
import { useNotifications } from '@/hooks/useNotifications'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { toast } from 'sonner'
import { format } from 'date-fns'

function TransactionModal({ isOpen, onClose, txToEdit = null }) {
  const { categories, addTransaction, updateTransaction } = useFinanceStore()
  const { pushError, pushSuccess } = useNotifications()
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    amount: '',
    type: 'expense',
    category: '',
    payment_method: 'bank',
    description: '',
  })

  useEffect(() => {
    if (txToEdit) {
      setFormData({
        date: txToEdit.date,
        amount: txToEdit.amount.toString(),
        type: txToEdit.type,
        category: txToEdit.category || '',
        payment_method: txToEdit.payment_method || 'bank',
        description: txToEdit.description || '',
      })
    } else {
      setFormData({
        date: format(new Date(), 'yyyy-MM-dd'),
        amount: '',
        type: 'expense',
        category: categories.find(c => c.type === 'expense')?.id || '',
        payment_method: 'bank',
        description: '',
      })
    }
  }, [txToEdit, isOpen, categories])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const payload = {
        ...formData,
        amount: parseFloat(formData.amount),
      }
      
      if (txToEdit) {
        const { data, error } = await supabase.from('transactions').update(payload).eq('id', txToEdit.id).select().single()
        if (error) throw error
        updateTransaction(txToEdit.id, data)
        toast.success('Transazione aggiornata')
        pushSuccess('Transazione aggiornata', 'edit')
      } else {
        const { data, error } = await supabase.from('transactions').insert(payload).select().single()
        if (error) throw error
        addTransaction(data)
        toast.success('Transazione creata')
        pushSuccess('Transazione creata', 'plus')
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

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={txToEdit ? 'Modifica Transazione' : 'Nuova Transazione'}
      className={isExpense ? 'shimmer-expense' : 'shimmer-income'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setFormData({ ...formData, type: 'expense' })}
            className={`flex-1 py-2.5 text-xs font-bold border rounded-[var(--radius-md)] transition-all ${
              isExpense 
                ? 'bg-[var(--color-danger-ghost)] border-[var(--color-danger)] text-[var(--color-danger)] shadow-sm' 
                : 'bg-[var(--bg-base)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:border-[var(--text-secondary)]'
            }`}
          >
            Uscita
          </button>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, type: 'income' })}
            className={`flex-1 py-2.5 text-xs font-bold border rounded-[var(--radius-md)] transition-all ${
              !isExpense 
                ? 'bg-[var(--color-success-ghost)] border-[var(--color-success)] text-[var(--color-success)] shadow-sm' 
                : 'bg-[var(--bg-base)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:border-[var(--text-secondary)]'
            }`}
          >
            Entrata
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

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[var(--text-secondary)]">Metodo</label>
          <div className="flex gap-2">
            {['bank', 'cash'].map(m => (
              <button
                key={m}
                type="button"
                onClick={() => setFormData({ ...formData, payment_method: m })}
                className={`flex-1 py-2 text-xs font-bold border rounded-[var(--radius-md)] transition-colors ${
                  formData.payment_method === m 
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary-ghost)] text-[var(--color-primary)] shadow-sm' 
                    : 'border-[var(--border-subtle)] text-[var(--text-muted)] hover:border-[var(--text-primary)]'
                }`}
              >
                {m === 'bank' ? 'Conto' : 'Contanti'}
              </button>
            ))}
          </div>
        </div>

        <Input 
          label="Descrizione (opzionale)" 
          placeholder="Es: Spesa Esselunga" 
          value={formData.description} 
          onChange={e => setFormData({ ...formData, description: e.target.value })} 
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Annulla</Button>
          <Button 
            type="submit" 
            loading={loading}
            className={`px-8 transition-all ${
              isExpense 
                ? 'bg-[var(--color-danger)] hover:bg-[#c0392b] text-white' 
                : 'bg-[var(--color-success)] hover:bg-[#27ae60] text-white'
            }`}
          >
            {txToEdit ? 'Aggiorna' : 'Crea Transazione'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default TransactionModal
