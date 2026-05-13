import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Calendar as CalIcon, MapPin, Clock, Trash2 } from 'lucide-react'
import { format, isSameDay } from 'date-fns'
import { it } from 'date-fns/locale'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { supabase } from '@/lib/supabase'
import { useCalendarStore } from '@/store/useCalendarStore'
import { useNotifications } from '@/hooks/useNotifications'

function DayDrawer({ isOpen, onClose, date, events, absences, onAddEvent }) {
  const { removeEvent, removeAbsence } = useCalendarStore()
  const { pushError } = useNotifications()

  const dayEvents = events.filter(e => isSameDay(new Date(e.date), date))
  const dayAbsences = absences.filter(a => isSameDay(new Date(a.date), date))

  const handleDeleteEvent = async (id) => {
    const { error } = await supabase.from('calendar_events').delete().eq('id', id)
    if (error) {
      pushError('Errore nell\'eliminazione')
    } else {
      removeEvent(id)
    }
  }

  const handleDeleteAbsence = async (id) => {
    const { error } = await supabase.from('absences').delete().eq('id', id)
    if (error) {
      pushError('Errore nell\'eliminazione')
    } else {
      removeAbsence(id)
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
            className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[110]"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white z-[120] shadow-2xl flex flex-col"
          >
            <div className="p-6 border-b border-[var(--border-subtle)] flex items-center justify-between pt-[calc(env(safe-area-inset-top)+24px)]">
              <div>
                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1">
                  {format(date, 'EEEE', { locale: it })}
                </p>
                <h2 className="text-xl font-bold text-[var(--text-primary)]">
                  {format(date, 'dd MMMM yyyy', { locale: it })}
                </h2>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-[var(--bg-base)] rounded-xl transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Eventi section */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">Eventi</h3>
                  <Button variant="ghost" size="xs" icon={Plus} onClick={onAddEvent}>Aggiungi</Button>
                </div>
                <div className="space-y-3">
                  {dayEvents.map(event => (
                    <div key={event.id} className="group p-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-base)] hover:border-[var(--color-primary)] transition-all">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <Badge variant="primary" className="text-[8px] uppercase">{event.category}</Badge>
                          <p className="text-sm font-bold text-[var(--text-primary)]">{event.title}</p>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
                              <Clock size={12} />
                              <span className="text-[10px] font-medium">{event.all_day ? 'Tutto il giorno' : event.start_time}</span>
                            </div>
                            {event.location && (
                              <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
                                <MapPin size={12} />
                                <span className="text-[10px] font-medium">{event.location}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <button onClick={() => handleDeleteEvent(event.id)} className="p-2 text-[var(--text-muted)] hover:text-[var(--color-danger)] opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {dayEvents.length === 0 && (
                    <div className="text-center py-10 text-[var(--text-muted)]">
                      <CalIcon size={32} className="mx-auto mb-2 opacity-20" />
                      <p className="text-xs font-bold uppercase tracking-widest opacity-40">Nessun evento</p>
                    </div>
                  )}
                </div>
              </section>

              {/* Assenze section */}
              {dayAbsences.length > 0 && (
                <section>
                  <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-4">Assenze</h3>
                  <div className="space-y-2">
                    {dayAbsences.map(abs => (
                      <div key={abs.id} className="flex items-center justify-between p-3 rounded-xl bg-[var(--color-danger-ghost)] text-[var(--color-danger)] border border-[var(--color-danger)]/10">
                        <span className="text-xs font-bold uppercase tracking-wider">{abs.type}</span>
                        <button onClick={() => handleDeleteAbsence(abs.id)} className="p-1 hover:bg-black/5 rounded">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default DayDrawer
