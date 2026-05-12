import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Calendar as CalIcon, MapPin, Clock, Trash2 } from 'lucide-react'
import { format, isSameDay } from 'date-fns'
import { it } from 'date-fns/locale'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { supabase } from '@/lib/supabase'
import { useCalendarStore } from '@/store/useCalendarStore'
import { toast } from 'sonner'

function DayDrawer({ isOpen, onClose, date, events, absences, onAddEvent }) {
  const { removeEvent, removeAbsence } = useCalendarStore()

  const dayEvents = events.filter(e => isSameDay(new Date(e.date), date))
  const dayAbsence = absences.find(a => {
    const d = format(date, 'yyyy-MM-dd')
    return d >= a.start_date && d <= a.end_date
  })

  const handleDeleteEvent = async (id) => {
    if (!confirm('Eliminare questo evento?')) return
    const { error } = await supabase.from('calendar_events').delete().eq('id', id)
    if (error) {
      toast.error('Errore nell\'eliminazione')
    } else {
      removeEvent(id)
      toast.success('Evento eliminato')
    }
  }

  const handleDeleteAbsence = async (id) => {
    if (!confirm('Eliminare questo periodo di assenza?')) return
    const { error } = await supabase.from('absences').delete().eq('id', id)
    if (error) {
      toast.error('Errore nell\'eliminazione')
    } else {
      removeAbsence(id)
      toast.success('Assenza eliminata')
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 z-[120] backdrop-blur-[1px]"
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-80 bg-white shadow-2xl z-[130] flex flex-col border-l border-[var(--border-subtle)]"
          >
            <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-base)]">
              <div>
                <p className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">
                  {format(date, 'EEEE', { locale: it })}
                </p>
                <p className="text-lg font-bold text-[var(--text-primary)]">
                  {format(date, 'dd MMMM yyyy', { locale: it })}
                </p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white rounded-lg transition-colors shadow-sm border border-transparent hover:border-[var(--border-subtle)]">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Assenze (Ferie/Malattia) */}
              {dayAbsence && (
                <div className="space-y-3">
                  <h4 className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-widest">Assenza</h4>
                  <div className={`p-3 rounded-xl border flex items-center justify-between ${
                    dayAbsence.type === 'ferie' ? 'bg-[#3d997008] border-[#3d997030]' : 'bg-[#e0525208] border-[#e0525230]'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${dayAbsence.type === 'ferie' ? 'bg-[#3d9970]' : 'bg-[#e05252]'}`} />
                      <p className="text-sm font-bold capitalize">{dayAbsence.type}</p>
                    </div>
                    <button onClick={() => handleDeleteAbsence(dayAbsence.id)} className="text-[var(--text-muted)] hover:text-[var(--color-danger)] p-1">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )}

              {/* Eventi */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-widest">Eventi</h4>
                  <Button variant="ghost" size="xs" icon={Plus} onClick={onAddEvent}>Aggiungi</Button>
                </div>
                
                {dayEvents.length === 0 ? (
                  <div className="text-center py-8 opacity-40">
                    <CalIcon size={32} className="mx-auto mb-2" />
                    <p className="text-xs font-medium">Nessun evento</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {dayEvents.map(event => (
                      <div key={event.id} className="p-3 rounded-xl bg-[var(--bg-base)] border border-[var(--border-subtle)] group">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="primary" className="text-[9px] px-1.5 py-0.5">{event.category || 'Generale'}</Badge>
                          <button onClick={() => handleDeleteEvent(event.id)} className="text-[var(--text-muted)] hover:text-[var(--color-danger)] opacity-0 group-hover:opacity-100 transition-opacity">
                            <Trash2 size={12} />
                          </button>
                        </div>
                        <p className="text-sm font-bold text-[var(--text-primary)] mb-1">{event.title}</p>
                        <div className="flex items-center gap-3 text-[10px] text-[var(--text-muted)]">
                          {!event.all_day && (
                            <span className="flex items-center gap-1"><Clock size={10} /> {event.start_time?.substring(0, 5)}</span>
                          )}
                          {event.location && (
                            <span className="flex items-center gap-1"><MapPin size={10} /> {event.location}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

export default DayDrawer
