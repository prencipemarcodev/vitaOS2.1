import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useCalendarStore } from '@/store/useCalendarStore'
import { useNotifications } from '@/hooks/useNotifications'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { toast } from 'sonner'
import { format } from 'date-fns'

const CATEGORIES = ['Generale', 'Lavoro', 'Personale', 'Salute', 'Altro']

function EventModal({ isOpen, onClose, initialDate }) {
  const { addEvent } = useCalendarStore()
  const { pushError } = useNotifications()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    date: format(initialDate || new Date(), 'yyyy-MM-dd'),
    start_time: '09:00',
    all_day: false,
    category: 'Generale',
    location: '',
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const payload = {
        ...formData,
        start_time: formData.all_day ? null : formData.start_time,
      }
      const { data, error } = await supabase.from('calendar_events').insert(payload).select().single()
      if (error) throw error
      addEvent(data)
      toast.success('Evento creato')
      onClose()
      setFormData({ title: '', date: format(new Date(), 'yyyy-MM-dd'), start_time: '09:00', all_day: false, category: 'Generale', location: '' })
    } catch (err) {
      pushError('Errore nella creazione')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nuovo Evento">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input 
          label="Titolo" 
          placeholder="Cosa devi fare?" 
          required 
          value={formData.title} 
          onChange={e => setFormData({ ...formData, title: e.target.value })} 
        />
        <div className="grid grid-cols-2 gap-4">
          <Input 
            label="Data" 
            type="date" 
            required 
            value={formData.date} 
            onChange={e => setFormData({ ...formData, date: e.target.value })} 
          />
          {!formData.all_day && (
            <Input 
              label="Ora" 
              type="time" 
              value={formData.start_time} 
              onChange={e => setFormData({ ...formData, start_time: e.target.value })} 
            />
          )}
        </div>
        <div className="flex items-center gap-2">
          <input 
            type="checkbox" 
            id="all_day" 
            checked={formData.all_day} 
            onChange={e => setFormData({ ...formData, all_day: e.target.checked })} 
          />
          <label htmlFor="all_day" className="text-xs font-bold text-[var(--text-secondary)]">Tutto il giorno</label>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[var(--text-secondary)]">Categoria</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setFormData({ ...formData, category: c })}
                className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-colors ${
                  formData.category === c 
                    ? 'bg-[var(--text-primary)] border-[var(--text-primary)] text-[var(--bg-surface)] shadow-md' 
                    : 'bg-white border-[var(--border-subtle)] text-[var(--text-muted)] hover:border-[var(--text-primary)]'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
        <Input 
          label="Luogo (opzionale)" 
          placeholder="Dove?" 
          value={formData.location} 
          onChange={e => setFormData({ ...formData, location: e.target.value })} 
        />
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Annulla</Button>
          <Button variant="primary" type="submit" loading={loading}>Crea Evento</Button>
        </div>
      </form>
    </Modal>
  )
}

export default EventModal
