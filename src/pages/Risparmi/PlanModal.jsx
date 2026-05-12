import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useSavingsStore } from '@/store/useSavingsStore'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { toast } from 'sonner'

const ICONS = ['🎯', '🏠', '🚗', '💻', '🌴', '💍', '🍼', '💰', '☂️', '🍔']

function PlanModal({ isOpen, onClose, planToEdit = null }) {
  const { addPlan, updatePlan } = useSavingsStore()
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    target_amount: '',
    current_amount: '0',
    monthly_contribution: '',
    target_date: '',
    priority: '2',
    icon: '🎯',
  })

  useEffect(() => {
    if (planToEdit) {
      setFormData({
        name: planToEdit.name,
        target_amount: planToEdit.target_amount.toString(),
        current_amount: (planToEdit.current_amount || 0).toString(),
        monthly_contribution: (planToEdit.monthly_contribution || 0).toString(),
        target_date: planToEdit.target_date || '',
        priority: planToEdit.priority?.toString() || '2',
        icon: planToEdit.icon || '🎯',
      })
    } else {
      setFormData({
        name: '',
        target_amount: '',
        current_amount: '0',
        monthly_contribution: '',
        target_date: '',
        priority: '2',
        icon: '🎯',
      })
    }
  }, [planToEdit, isOpen])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const payload = {
        ...formData,
        target_amount: parseFloat(formData.target_amount),
        current_amount: parseFloat(formData.current_amount),
        monthly_contribution: parseFloat(formData.monthly_contribution || 0),
        priority: parseInt(formData.priority),
      }
      
      if (planToEdit) {
        const { data, error } = await supabase.from('saving_plans').update(payload).eq('id', planToEdit.id).select().single()
        if (error) throw error
        updatePlan(planToEdit.id, data)
        toast.success('Piano aggiornato')
      } else {
        const { data, error } = await supabase.from('saving_plans').insert(payload).select().single()
        if (error) throw error
        addPlan(data)
        toast.success('Piano creato')
      }
      onClose()
    } catch (err) {
      toast.error('Errore nel salvataggio')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={planToEdit ? 'Modifica Piano' : 'Nuovo Piano Risparmio'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center gap-1">
            <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Icona</label>
            <select 
              className="bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-xl px-2 py-1.5 text-lg"
              value={formData.icon}
              onChange={e => setFormData({ ...formData, icon: e.target.value })}
            >
              {ICONS.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>
          <div className="flex-1">
            <Input 
              label="Nome Obiettivo" 
              placeholder="Es: Casa nuova" 
              required 
              value={formData.name} 
              onChange={e => setFormData({ ...formData, name: e.target.value })} 
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input 
            label="Target (€)" 
            type="number" 
            required 
            placeholder="5000"
            value={formData.target_amount} 
            onChange={e => setFormData({ ...formData, target_amount: e.target.value })} 
          />
          <Input 
            label="Contributo Mensile (€)" 
            type="number" 
            placeholder="100"
            value={formData.monthly_contribution} 
            onChange={e => setFormData({ ...formData, monthly_contribution: e.target.value })} 
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input 
            label="Data Scadenza" 
            type="date" 
            value={formData.target_date} 
            onChange={e => setFormData({ ...formData, target_date: e.target.value })} 
          />
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[var(--text-secondary)]">Priorità</label>
            <select 
              className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-sm"
              value={formData.priority}
              onChange={e => setFormData({ ...formData, priority: e.target.value })}
            >
              <option value="3">Alta</option>
              <option value="2">Media</option>
              <option value="1">Bassa</option>
            </select>
          </div>
        </div>

        <Input 
          label="Saldo Iniziale (€)" 
          type="number" 
          value={formData.current_amount} 
          onChange={e => setFormData({ ...formData, current_amount: e.target.value })} 
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Annulla</Button>
          <Button variant="primary" type="submit" loading={loading}>{planToEdit ? 'Aggiorna' : 'Crea Piano'}</Button>
        </div>
      </form>
    </Modal>
  )
}

export default PlanModal
