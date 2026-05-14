import { useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { useCalendarStore } from '@/store/useCalendarStore'
import { useNotifications } from '@/hooks/useNotifications'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { toast } from 'sonner'
import { format, addMinutes, parseISO } from 'date-fns'
import { AlertTriangle, Clock, ArrowRight } from 'lucide-react'

const CATEGORIES = ['Generale', 'Lavoro', 'Studio', 'Palestra', 'Personale', 'Salute', 'Altro']

function EventModal({ isOpen, onClose, initialDate }) {
  const { events, addEvent, updateEvent } = useCalendarStore()
  const { pushError } = useNotifications()
  const [loading, setLoading] = useState(false)
  const [conflicts, setConflicts] = useState([])
  const [formData, setFormData] = useState({
    title: '',
    date: format(initialDate || new Date(), 'yyyy-MM-dd'),
    start_time: '09:00',
    end_time: '10:00',
    all_day: false,
    category: 'Generale',
    location: '',
  })

  const timeToMinutes = (t) => {
    if (!t) return 0
    const [h, m] = t.split(':').map(Number)
    return h * 60 + m
  }

  const checkConflicts = () => {
    if (formData.all_day) return []
    
    const newStart = timeToMinutes(formData.start_time)
    const newEnd = timeToMinutes(formData.end_time)

    return events.filter(e => {
      if (e.date !== formData.date || e.all_day) return false
      const eStart = timeToMinutes(e.start_time)
      const eEnd = timeToMinutes(e.end_time || addMinutes(parseISO(`2000-01-01T${e.start_time}`), 60).toTimeString().substring(0, 5))
      
      // Controllo sovrapposizione: (StartA < EndB) && (EndA > StartB)
      return (newStart < eEnd) && (newEnd > eStart)
    })
  }

  const handleSave = async (overrides = {}) => {
    setLoading(true)
    try {
      const payload = {
        ...formData,
        ...overrides,
        start_time: formData.all_day ? null : (overrides.start_time || formData.start_time),
        end_time: formData.all_day ? null : (overrides.end_time || formData.end_time),
      }

      const { data, error } = await supabase.from('calendar_events').insert(payload).select().single()
      if (error) throw error
      
      addEvent(data)
      toast.success('Evento creato')
      onClose()
      resetForm()
    } catch (err) {
      pushError('Errore nella creazione')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({ title: '', date: format(new Date(), 'yyyy-MM-dd'), start_time: '09:00', end_time: '10:00', all_day: false, category: 'Generale', location: '' })
    setConflicts([])
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const foundConflicts = checkConflicts()
    if (foundConflicts.length > 0) {
      setConflicts(foundConflicts)
    } else {
      handleSave()
    }
  }

  // Risoluzione: Accorcia l'evento esistente
  const resolveShorten = async (conflict) => {
    setLoading(true)
    try {
      // L'evento esistente finirà quando inizia il nuovo
      const { error } = await supabase
        .from('calendar_events')
        .update({ end_time: formData.start_time })
        .eq('id', conflict.id)
      
      if (error) throw error
      updateEvent(conflict.id, { ...conflict, end_time: formData.start_time })
      handleSave()
    } catch (err) {
      pushError('Errore nella risoluzione')
      setLoading(false)
    }
  }

  // Risoluzione: Posticipa il nuovo evento
  const resolvePostpone = async (conflict) => {
    const conflictEnd = conflict.end_time || '10:00'
    const duration = timeToMinutes(formData.end_time) - timeToMinutes(formData.start_time)
    const newStart = conflictEnd
    const newEndMinutes = timeToMinutes(newStart) + duration
    const newEnd = `${Math.floor(newEndMinutes / 60).toString().padStart(2, '0')}:${(newEndMinutes % 60).toString().padStart(2, '0')}`
    
    handleSave({ start_time: newStart, end_time: newEnd })
  }

  if (conflicts.length > 0) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Conflitto Rilevato">
        <div className="space-y-6">
          <div className="bg-[#fff9e6] border border-[#ffe58f] p-4 rounded-2xl flex gap-3">
            <AlertTriangle className="text-[#faad14] shrink-0" size={20} />
            <div>
              <p className="text-xs font-bold text-[#856404] mb-1">Attenzione: Sovrapposizione eventi</p>
              <p className="text-[10px] text-[#856404] opacity-80">
                Il nuovo evento si sovrappone a impegni già esistenti. Come vuoi procedere?
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {conflicts.map(c => (
              <div key={c.id} className="p-3 bg-[var(--bg-base)] rounded-xl border border-[var(--border-subtle)]">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-xs font-bold text-[var(--text-primary)]">{c.title}</h4>
                  <span className="text-[10px] font-bold text-[var(--text-muted)]">{c.start_time} - {c.end_time || '?'}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => resolveShorten(c)}
                    className="flex flex-col items-center gap-1 p-2 bg-white border border-[var(--border-subtle)] rounded-lg hover:border-[var(--color-primary)] transition-all"
                  >
                    <Clock size={14} className="text-[var(--color-primary)]" />
                    <span className="text-[9px] font-bold">Accorcia "{c.title}"</span>
                  </button>
                  <button 
                    onClick={() => resolvePostpone(c)}
                    className="flex flex-col items-center gap-1 p-2 bg-white border border-[var(--border-subtle)] rounded-lg hover:border-[var(--color-primary)] transition-all"
                  >
                    <ArrowRight size={14} className="text-[var(--color-primary)]" />
                    <span className="text-[9px] font-bold">Posticipa nuovo</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setConflicts([])}>Annulla</Button>
            <Button variant="primary" onClick={() => handleSave()} loading={loading}>Ignora e Salva</Button>
          </div>
        </div>
      </Modal>
    )
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input 
            label="Data" 
            type="date" 
            required 
            value={formData.date} 
            onChange={e => setFormData({ ...formData, date: e.target.value })} 
          />
          {!formData.all_day && (
            <>
              <Input 
                label="Inizio" 
                type="time" 
                value={formData.start_time} 
                onChange={e => setFormData({ ...formData, start_time: e.target.value })} 
              />
              <Input 
                label="Fine" 
                type="time" 
                value={formData.end_time} 
                onChange={e => setFormData({ ...formData, end_time: e.target.value })} 
              />
            </>
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
