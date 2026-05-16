import { useState, useEffect } from 'react'
import { useFirmeStore } from '@/store/useFirmeStore'
import { useNotifications } from '@/hooks/useNotifications'
import { useAuthStore } from '@/store/useAuthStore'
import { supabase } from '@/lib/supabase'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { toast } from 'sonner'
import { format, parseISO } from 'date-fns'

function SessionForm({ isOpen, onClose, sessionToEdit = null }) {
  const { addSession, updateSession } = useFirmeStore()
  const { pushError } = useNotifications()
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    start_time: '09:00',
    end_time: '18:00',
    notes: '',
  })

  useEffect(() => {
    if (sessionToEdit) {
      setFormData({
        date: sessionToEdit.date,
        start_time: sessionToEdit.check_in.substring(0, 5),
        end_time: sessionToEdit.check_out ? sessionToEdit.check_out.substring(0, 5) : '',
        notes: sessionToEdit.notes || '',
      })
    } else {
      setFormData({
        date: format(new Date(), 'yyyy-MM-dd'),
        start_time: '09:00',
        end_time: '18:00',
        notes: '',
      })
    }
  }, [sessionToEdit, isOpen])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    const [h1, m1] = formData.start_time.split(':').map(Number)
    const [h2, m2] = formData.end_time.split(':').map(Number)
    const duration = (h2 * 60 + m2) - (h1 * 60 + m1)

    if (duration <= 0) {
      pushError('L\'uscita deve essere successiva all\'entrata')
      setLoading(false)
      return
    }

    const payload = {
      user_id: user?.id,
      date: formData.date,
      check_in: formData.start_time,
      check_out: formData.end_time,
      duration_minutes: duration,
      notes: formData.notes,
      is_manual: true,
    }

    try {
      if (sessionToEdit) {
        const { data, error } = await supabase
          .from('work_sessions')
          .update(payload)
          .eq('id', sessionToEdit.id)
          .select()
          .single()
        if (error) throw error
        updateSession(sessionToEdit.id, data)
        toast.success('Sessione aggiornata')
      } else {
        const { data, error } = await supabase
          .from('work_sessions')
          .insert(payload)
          .select()
          .single()
        if (error) throw error
        addSession(data)
        toast.success('Sessione salvata')
      }
      onClose()
    } catch (err) {
      pushError('Errore nel salvataggio')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={sessionToEdit ? 'Modifica Sessione' : 'Nuova Sessione'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Data"
          type="date"
          required
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Entrata"
            type="time"
            required
            value={formData.start_time}
            onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
          />
          <Input
            label="Uscita"
            type="time"
            required
            value={formData.end_time}
            onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
          />
        </div>
        <Input
          label="Note (opzionale)"
          placeholder="Es: Lavoro su progetto X..."
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        />
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" type="button" onClick={onClose}>Annulla</Button>
          <Button variant="primary" type="submit" loading={loading}>
            {sessionToEdit ? 'Aggiorna' : 'Salva Sessione'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default SessionForm
