import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useFinanceStore } from '@/store/useFinanceStore'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { toast } from 'sonner'
import { format } from 'date-fns'

function TransactionModal({ isOpen, onClose, txToEdit = null }) {
  const { categories, addTransaction, updateTransaction } = useFinanceStore()
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    amount: '',
    type: 'expense',
    category_id: '',
    method: 'bank',
    description: '',
  })

  useEffect(() => {
    if (txToEdit) {
      setFormData({
        date: txToEdit.date,
        amount: txToEdit.amount.toString(),
        type: txToEdit.type,
        category_id: txToEdit.category_id || '',
        method: txToEdit.method,
        description: txToEdit.description || '',
      })
    } else {
      setFormData({
        date: format(new Date(), 'yyyy-MM-dd'),
        amount: '',
        type: 'expense',
        category_id: categories.find(c => c.type === 'expense')?.id || '',
        method: 'bank',
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
      } else {
        const { data, error } = await supabase.from('transactions').insert(payload).select().single()
        if (error) throw error
        addTransaction(data)
        toast.success('Transazione creata')
      }
      onClose()
    } catch (err) {
      toast.error('Errore nel salvataggio')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={txToEdit ? 'Modifica Transazione' : 'Nuova Transazione'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex bg-[var(--bg-base)] p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setFormData({ ...formData, type: 'expense' })}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${formData.type === 'expense' ? 'bg-white shadow-sm text-[var(--color-danger)]' : 'text-[var(--text-muted)]'}`}
          >
            Uscita
          </button>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, type: 'income' })}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${formData.type === 'income' ? 'bg-white shadow-sm text-[var(--color-primary)]' : 'text-[var(--text-muted)]'}`}
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
            className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-ghost)]"
            value={formData.category_id}
            onChange={e => setFormData({ ...formData, category_id: e.target.value })}
            required
          >
            <option value="" disabled>Seleziona categoria</option>
            {categories.filter(c => c.type === formData.type).map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[var(--text-secondary)]">Metodo</label>
          <div className="flex gap-2">
            {['bank', 'cash'].map(m => (
              <button
                key={m}
                type="button"
                onClick={() => setFormData({ ...formData, method: m })}
                className={`flex-1 py-2 text-xs font-bold border rounded-xl transition-colors ${
                  formData.method === m 
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary-ghost)] text-[var(--color-primary)]' 
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
          <Button variant="primary" type="submit" loading={loading}>{txToEdit ? 'Aggiorna' : 'Crea Transazione'}</Button>
        </div>
      </form>
    </Modal>
  )
}

export default TransactionModal
