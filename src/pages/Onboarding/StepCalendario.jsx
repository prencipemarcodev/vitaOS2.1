import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, CalendarPlus, Trash2, Heart, Gift, Award, HelpCircle } from 'lucide-react'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

export default function StepCalendario({ formData, updateFormData }) {
  // Gestione form interno per aggiungere ricorrenze
  const [newTitle, setNewTitle] = useState('')
  const [newMonth, setNewMonth] = useState('1')
  const [newDay, setNewDay] = useState('1')
  const [newCategory, setNewCategory] = useState('compleanno')
  const [newNotifyDays, setNewNotifyDays] = useState(3)

  const recurringEvents = formData.recurring_events || []

  const handleAddEvent = () => {
    if (!newTitle.trim()) return
    const ev = {
      title: newTitle.trim(),
      month: parseInt(newMonth),
      day: parseInt(newDay),
      category: newCategory,
      notify_days_before: parseInt(newNotifyDays)
    }
    updateFormData({
      recurring_events: [...recurringEvents, ev]
    })
    setNewTitle('')
  }

  const handleRemoveEvent = (idx) => {
    updateFormData({
      recurring_events: recurringEvents.filter((_, i) => i !== idx)
    })
  }

  const CATEGORIES = [
    { id: 'compleanno', label: 'Compleanno', icon: Gift, color: 'text-pink-500' },
    { id: 'anniversario', label: 'Anniversario', icon: Heart, color: 'text-red-500' },
    { id: 'personale', label: 'Personale', icon: Calendar, color: 'text-blue-500' },
    { id: 'lavoro', label: 'Lavoro', icon: Award, color: 'text-amber-500' },
  ]

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="text-center space-y-2">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
          className="w-16 h-16 mx-auto rounded-2xl bg-[var(--color-primary-ghost)] flex items-center justify-center"
        >
          <Calendar size={28} className="text-[var(--color-primary)]" />
        </motion.div>
        <h2 className="text-2xl font-medium text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
          Calendario & Ricorrenze
        </h2>
        <p className="text-sm text-[var(--text-secondary)] max-w-sm mx-auto">
          Imposta le festività locali, il tuo monte ferie annuale e le ricorrenze più importanti da ricordare.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Santo Patrono */}
        <Card padding="md" className="space-y-3">
          <p className="text-xs font-black uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
            🎉 Festività locale
          </p>
          <Input
            label="Santo Patrono (Festa Locale)"
            type="date"
            value={formData.patron_saint_date || ''}
            onChange={(e) => updateFormData({ patron_saint_date: e.target.value })}
            description="Questa giornata verrà considerata automaticamente come giorno festivo (non lavorativo)."
          />
        </Card>

        {/* Ferie Spettanti */}
        <Card padding="md" className="space-y-3">
          <p className="text-xs font-black uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
            🏖️ Gestione Ferie
          </p>
          <Input
            label="Ferie Annuali Spettanti (Giorni)"
            type="number"
            min="0"
            max="100"
            value={formData.annual_leave_days ?? 26}
            onChange={(e) => updateFormData({ annual_leave_days: parseInt(e.target.value) || 0 })}
            description="Monte ore/giorni di ferie spettanti all'anno (es: 26 o 30)."
          />
        </Card>
      </div>

      {/* Sezione Ricorrenze Annuali */}
      <Card padding="lg" className="space-y-4">
        <div className="flex items-center gap-2">
          <CalendarPlus size={16} className="text-[var(--color-primary)]" />
          <h3 className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)]">Aggiungi Compleanni e Ricorrenze</h3>
        </div>

        {/* Form Aggiunta */}
        <div className="space-y-3 p-3 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Titolo / Nome"
              placeholder="es. Compleanno Mamma"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-[var(--text-secondary)] mb-1">Giorno</label>
                <select
                  value={newDay}
                  onChange={(e) => setNewDay(e.target.value)}
                  className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)] cursor-pointer"
                >
                  {Array.from({ length: 31 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>{i + 1}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-wider text-[var(--text-secondary)] mb-1">Mese</label>
                <select
                  value={newMonth}
                  onChange={(e) => setNewMonth(e.target.value)}
                  className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)] cursor-pointer"
                >
                  {[
                    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
                    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
                  ].map((m, i) => (
                    <option key={i + 1} value={i + 1}>{m}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-[var(--text-secondary)] mb-1">Categoria</label>
              <div className="grid grid-cols-4 gap-1.5">
                {CATEGORIES.map(c => {
                  const Icon = c.icon
                  const isSelected = newCategory === c.id
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setNewCategory(c.id)}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${
                        isSelected 
                          ? 'border-[var(--color-primary)] bg-[var(--color-primary-ghost)]' 
                          : 'border-[var(--border-subtle)] bg-[var(--bg-base)] hover:bg-[var(--bg-hover)]'
                      }`}
                      title={c.label}
                    >
                      <Icon size={14} className={c.color} />
                    </button>
                  )
                })}
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-wider text-[var(--text-secondary)] mb-1">Preavviso Notifica (Giorni)</label>
              <select
                value={newNotifyDays}
                onChange={(e) => setNewNotifyDays(parseInt(e.target.value))}
                className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--color-primary)] cursor-pointer"
              >
                {[0, 1, 2, 3, 5, 7].map(d => (
                  <option key={d} value={d}>{d === 0 ? 'Nessuno (stesso giorno)' : `${d} giorni prima`}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleAddEvent}
              disabled={!newTitle.trim()}
            >
              Aggiungi Ricorrenza
            </Button>
          </div>
        </div>

        {/* Lista Eventi Aggiunti */}
        <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
          <AnimatePresence initial={false}>
            {recurringEvents.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)] italic text-center py-4">Nessuna ricorrenza inserita ancora.</p>
            ) : (
              recurringEvents.map((ev, idx) => {
                const cat = CATEGORIES.find(c => c.id === ev.category) || CATEGORIES[0]
                const Icon = cat.icon
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-center shrink-0">
                        <Icon size={12} className={cat.color} />
                      </div>
                      <div>
                        <p className="font-bold text-[var(--text-primary)]">{ev.title}</p>
                        <p className="text-[10px] text-[var(--text-muted)]">
                          {ev.day}/{ev.month} · Notifica: {ev.notify_days_before === 0 ? 'stesso giorno' : `${ev.notify_days_before}gg prima`}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveEvent(idx)}
                      className="p-1.5 text-[var(--color-danger)] hover:bg-[var(--color-danger-ghost)] rounded-lg transition-colors shrink-0"
                    >
                      <Trash2 size={12} />
                    </button>
                  </motion.div>
                )
              })
            )}
          </AnimatePresence>
        </div>
      </Card>
    </div>
  )
}
