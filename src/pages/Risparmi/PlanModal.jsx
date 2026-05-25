import { useState, useEffect, useMemo } from 'react'
import clsx from 'clsx'
import { supabase } from '@/lib/supabase'
import { useSavingsStore } from '@/store/useSavingsStore'
import { useAuthStore } from '@/store/useAuthStore'
import { useNotifications } from '@/hooks/useNotifications'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { toast } from 'sonner'
import IconPickerModal from '@/components/ui/IconPickerModal'
import { getIcon } from '@/lib/icons'

function PlanModal({ isOpen, onClose, planToEdit = null }) {
  const { addPlan, updatePlan } = useSavingsStore()
  const { pushError } = useNotifications()
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [showIconPicker, setShowIconPicker] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    type: 'goal', // 'goal' o 'piggy_bank'
    target_amount: '',
    current_amount: '0',
    monthly_contribution: '',
    target_date: '',
    priority: '2',
    icon: 'Target',
  })

  useEffect(() => {
    if (planToEdit) {
      setFormData({
        name: planToEdit.name,
        type: planToEdit.type || 'goal',
        target_amount: (planToEdit.target_amount || '').toString(),
        current_amount: (planToEdit.current_amount || 0).toString(),
        monthly_contribution: (planToEdit.monthly_contribution || 0).toString(),
        target_date: planToEdit.target_date || '',
        priority: planToEdit.priority?.toString() || '2',
        icon: planToEdit.icon || 'Target',
      })
    } else {
      setFormData({
        name: '',
        type: 'goal',
        target_amount: '',
        current_amount: '0',
        monthly_contribution: '',
        target_date: '',
        priority: '2',
        icon: 'Target',
      })
    }
  }, [planToEdit, isOpen])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const payload = {
        ...formData,
        target_amount: formData.type === 'piggy_bank' ? 0 : parseFloat(formData.target_amount),
        current_amount: parseFloat(formData.current_amount || 0),
        monthly_contribution: formData.type === 'piggy_bank' ? 0 : parseFloat(formData.monthly_contribution || 0),
        priority: parseInt(formData.priority),
        target_date: formData.type === 'piggy_bank' ? null : (formData.target_date || null),
      }
      
      if (planToEdit) {
        const { data, error } = await supabase.from('saving_plans').update(payload).eq('id', planToEdit.id).eq('user_id', user?.id).select().single()
        if (error) throw error
        updatePlan(planToEdit.id, data)
        toast.success('Piano aggiornato')
      } else {
        const { data, error } = await supabase.from('saving_plans').insert({ ...payload, user_id: user?.id }).select().single()
        if (error) throw error
        addPlan(data)
        toast.success('Piano creato')
      }
      onClose()
    } catch (err) {
      console.error(err)
      pushError('Errore nel salvataggio')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={planToEdit ? 'Modifica Piano' : 'Nuova Piano Risparmio'}>
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {/* Tipo di Piano */}
        <div className="flex bg-[var(--bg-base)] p-1 rounded-xl border border-[var(--border-subtle)]">
          <button
            type="button"
            className={clsx(
              "flex-1 py-2 text-xs font-bold rounded-lg transition-all",
              formData.type === 'goal' ? "bg-white shadow-sm text-[var(--color-primary)]" : "text-[var(--text-muted)]"
            )}
            onClick={() => setFormData({ ...formData, type: 'goal' })}
          >
            Obiettivo
          </button>
          <button
            type="button"
            className={clsx(
              "flex-1 py-2 text-xs font-bold rounded-lg transition-all",
              formData.type === 'piggy_bank' ? "bg-white shadow-sm text-[var(--color-primary)]" : "text-[var(--text-muted)]"
            )}
            onClick={() => setFormData({ ...formData, type: 'piggy_bank', icon: 'PiggyBank' })}
          >
            Salvadanaio
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex flex-col items-center gap-1">
            <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Icona</label>
            <button 
              type="button"
              onClick={() => setShowIconPicker(true)}
              className="w-12 h-10 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] flex items-center justify-center text-[var(--color-primary)] hover:border-[var(--color-primary)] transition-all"
            >
              {(() => {
                const Icon = getIcon(formData.icon)
                return <Icon size={20} />
              })()}
            </button>
          </div>
          <div className="flex-1">
            <Input 
              label="Nome" 
              placeholder={formData.type === 'piggy_bank' ? "Es: Spiccioli" : "Es: Casa nuova"} 
              required 
              value={formData.name} 
              onChange={e => setFormData({ ...formData, name: e.target.value })} 
            />
          </div>
        </div>

        {/* ... resto del form ... */}
        {formData.type === 'goal' && (
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
        )}

        <div className="grid grid-cols-2 gap-4">
          {formData.type === 'goal' && (
            <Input 
              label="Data Scadenza" 
              type="date" 
              value={formData.target_date} 
              onChange={e => setFormData({ ...formData, target_date: e.target.value })} 
            />
          )}
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

      <IconPickerModal 
        isOpen={showIconPicker} 
        onClose={() => setShowIconPicker(false)}
        currentIcon={formData.icon}
        onSelect={(icon) => setFormData({ ...formData, icon })}
      />
    </Modal>
  )
}

export default PlanModal
