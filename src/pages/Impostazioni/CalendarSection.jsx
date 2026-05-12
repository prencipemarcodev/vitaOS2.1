import { useState, useCallback } from 'react'
import { Plus, X, Calendar } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { useCalendarStore } from '@/store/useCalendarStore'
import { supabase } from '@/lib/supabase'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'

const MONTHS = ['Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic']

function CalendarSection() {
  const { userConfig, setUserConfig } = useAppStore()
  const { recurringEvents, setRecurringEvents } = useCalendarStore()
  const [showAdd, setShowAdd] = useState(false)
  const [newEvent, setNewEvent] = useState({ title: '', month: 1, day: 1, category: 'personale', icon: '🎂', notify_days_before: 3 })

  const handleSavePatron = async (e) => {
    const value = e.target.value || null
    if (userConfig?.id) {
      setUserConfig({ ...userConfig, patron_saint_date: value })
      await supabase.from('user_config').update({ patron_saint_date: value }).eq('id', userConfig.id)
    }
  }

  const handleAdd = async () => {
    if (!newEvent.title.trim()) return
    const { data } = await supabase.from('recurring_events').insert(newEvent).select().single()
    if (data) {
      setRecurringEvents([...recurringEvents, data])
      setNewEvent({ title: '', month: 1, day: 1, category: 'personale', icon: '🎂', notify_days_before: 3 })
      setShowAdd(false)
    }
  }

  const handleDelete = async (id) => {
    await supabase.from('recurring_events').delete().eq('id', id)
    setRecurringEvents(recurringEvents.filter((e) => e.id !== id))
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-medium text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
          Calendario
        </h3>
        <p className="text-sm text-[var(--text-muted)] mt-0.5">
          Ricorrenze annuali, patrono e ferie
        </p>
      </div>

      {/* Santo Patrono */}
      <Card padding="lg" className="space-y-3">
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-[var(--color-primary)]" />
          <p className="text-sm font-medium text-[var(--text-primary)]">Santo Patrono</p>
        </div>
        <input
          type="date"
          value={userConfig?.patron_saint_date || ''}
          onChange={handleSavePatron}
          className="w-full h-9 rounded-[var(--radius-md)] border border-[var(--border-default)]
            bg-[var(--bg-surface)] text-[var(--text-primary)] text-sm px-3
            focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        />
        <p className="text-xs text-[var(--text-muted)]">
          Verrà aggiunto automaticamente come festività al calendario
        </p>
      </Card>

      {/* Ferie */}
      <Card padding="lg" className="space-y-3">
        <p className="text-sm font-medium text-[var(--text-primary)]">Ferie annuali</p>
        <div className="grid grid-cols-3 gap-3">
          <Input
            label="Disponibili"
            type="number"
            value={userConfig?.annual_leave_days || ''}
            onChange={async (e) => {
              const v = parseInt(e.target.value) || 0
              setUserConfig({ ...userConfig, annual_leave_days: v })
              if (userConfig?.id) await supabase.from('user_config').update({ annual_leave_days: v }).eq('id', userConfig.id)
            }}
          />
          <Input
            label="Ferie usate"
            type="number"
            value={userConfig?.leave_days_used || ''}
            onChange={async (e) => {
              const v = parseFloat(e.target.value) || 0
              setUserConfig({ ...userConfig, leave_days_used: v })
              if (userConfig?.id) await supabase.from('user_config').update({ leave_days_used: v }).eq('id', userConfig.id)
            }}
          />
          <Input
            label="Malattia usata"
            type="number"
            value={userConfig?.sick_days_used || ''}
            onChange={async (e) => {
              const v = parseFloat(e.target.value) || 0
              setUserConfig({ ...userConfig, sick_days_used: v })
              if (userConfig?.id) await supabase.from('user_config').update({ sick_days_used: v }).eq('id', userConfig.id)
            }}
          />
        </div>
      </Card>

      {/* Ricorrenze */}
      <Card padding="lg" className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-[var(--text-primary)]">Ricorrenze annuali</p>
          <Button variant="primary_ghost" size="xs" icon={Plus} onClick={() => setShowAdd(true)}>Aggiungi</Button>
        </div>

        {recurringEvents.length === 0 ? (
          <p className="text-xs text-[var(--text-muted)] py-3 text-center">
            Nessuna ricorrenza configurata. Aggiungi compleanni, anniversari, ecc.
          </p>
        ) : (
          <div className="space-y-1.5">
            {recurringEvents.map((ev) => (
              <div key={ev.id} className="flex items-center justify-between p-2 rounded-[var(--radius-md)] bg-[var(--bg-elevated)]">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{ev.icon}</span>
                  <div>
                    <p className="text-xs font-medium text-[var(--text-primary)]">{ev.title}</p>
                    <p className="text-[10px] text-[var(--text-muted)]">{ev.day} {MONTHS[ev.month - 1]}</p>
                  </div>
                </div>
                <button onClick={() => handleDelete(ev.id)} className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--color-danger)] transition-colors">
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Add Modal */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Nuova ricorrenza" footer={
        <>
          <Button variant="ghost" onClick={() => setShowAdd(false)}>Annulla</Button>
          <Button variant="primary" onClick={handleAdd}>Aggiungi</Button>
        </>
      }>
        <div className="space-y-4">
          <Input label="Titolo" value={newEvent.title} onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })} placeholder="es. Compleanno Marco" />
          <div className="grid grid-cols-3 gap-3">
            <Input label="Giorno" type="number" min={1} max={31} value={newEvent.day} onChange={(e) => setNewEvent({ ...newEvent, day: parseInt(e.target.value) })} />
            <div>
              <label className="text-sm font-medium text-[var(--text-secondary)] mb-1 block">Mese</label>
              <select value={newEvent.month} onChange={(e) => setNewEvent({ ...newEvent, month: parseInt(e.target.value) })}
                className="w-full h-9 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] text-sm px-3">
                {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <Input label="Icona" value={newEvent.icon} onChange={(e) => setNewEvent({ ...newEvent, icon: e.target.value })} />
          </div>
          <Input label="Notifica X giorni prima" type="number" min={0} max={30} value={newEvent.notify_days_before} onChange={(e) => setNewEvent({ ...newEvent, notify_days_before: parseInt(e.target.value) })} />
        </div>
      </Modal>
    </div>
  )
}

export default CalendarSection
