import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Calendar as CalIcon, MapPin, Clock, Trash2, Circle, Check } from 'lucide-react'
import { format, isSameDay } from 'date-fns'
import { it } from 'date-fns/locale'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { supabase } from '@/lib/supabase'
import { useCalendarStore } from '@/store/useCalendarStore'
import { useNotifications } from '@/hooks/useNotifications'
import { useAppStore } from '@/store/useAppStore'
import { useAuthStore } from '@/store/useAuthStore'
import { useTaskStore } from '@/store/useTaskStore'
import { Briefcase, GraduationCap, Dumbbell, Star, CreditCard } from 'lucide-react'
import { isHoliday } from '@/lib/italianCalendar'
import { useState } from 'react'

function DayDrawer({ isOpen, onClose, date, events, absences, recurringEvents = [], subscriptions = [], onAddEvent }) {
  const { removeEvent, removeAbsence } = useCalendarStore()
  const { pushError } = useNotifications()
  const { userConfig } = useAppStore()
  const { user } = useAuthStore()
  const { tasks, addTask, updateTask, removeTask } = useTaskStore()

  const [addingTask, setAddingTask] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskPriority, setNewTaskPriority] = useState('medium')

  const dayEvents = events.filter(e => isSameDay(new Date(e.date), date))
  const dayRecurring = recurringEvents.filter(re => date.getDate() === re.day && (date.getMonth() + 1) === re.month)
  const dayAbsences = absences.filter(a => {
    const d = new Date(a.start_date)
    const e = new Date(a.end_date)
    return date >= d && date <= e
  })
  const dayTasks = tasks.filter(t => isSameDay(new Date(t.date), date))
  const daySubscriptions = subscriptions.filter(sub => {
    if (!sub.is_active || !sub.next_renewal_date) return false
    return isSameDay(new Date(sub.next_renewal_date), date)
  })

  // Programma del giorno (Work, Study, Gym)
  const getSchedule = (type) => {
    if (!userConfig) return null
    const schedules = userConfig[`${type}_schedule`]
    if (!schedules) return null
    const dayIndex = date.getDay().toString()
    const sched = schedules[dayIndex]
    if (sched?.enabled) return sched
    return null
  }

  const workSched = getSchedule('work')
  const studySched = getSchedule('study')
  const gymSched = getSchedule('gym')
  const hasProgram = workSched || studySched || gymSched

  const handleDeleteEvent = async (id) => {
    // Filtro anche per user_id per prevenire IDOR (VUL-003)
    const { error } = await supabase.from('calendar_events').delete().eq('id', id).eq('user_id', user?.id)
    if (error) {
      pushError('Errore nell\'eliminazione')
    } else {
      removeEvent(id)
    }
  }

  const handleDeleteAbsence = async (id) => {
    // Filtro anche per user_id per prevenire IDOR (VUL-003)
    const { error } = await supabase.from('absences').delete().eq('id', id).eq('user_id', user?.id)
    if (error) {
      pushError('Errore nell\'eliminazione')
    } else {
      removeAbsence(id)
    }
  }

  const handleAddTask = async (e) => {
    e.preventDefault()
    if (!newTaskTitle.trim()) return
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const payload = {
        user_id: user.id,
        title: newTaskTitle,
        date: format(date, 'yyyy-MM-dd'),
        priority: newTaskPriority,
        completed: false
      }

      const { data, error } = await supabase.from('tasks').insert(payload).select().single()
      if (error) throw error
      if (data) {
        addTask(data)
        setNewTaskTitle('')
        setAddingTask(false)
      }
    } catch (err) {
      console.error(err)
      pushError('Errore nella creazione del task')
    }
  }

  const handleToggleTask = async (task) => {
    const updated = !task.completed
    try {
      const { error } = await supabase.from('tasks').update({ completed: updated }).eq('id', task.id)
      if (error) throw error
      updateTask(task.id, { completed: updated })
    } catch (err) {
      console.error(err)
      pushError('Errore nell\'aggiornamento del task')
    }
  }

  const handleDeleteTask = async (id) => {
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', id)
      if (error) throw error
      removeTask(id)
    } catch (err) {
      console.error(err)
      pushError('Errore nell\'eliminazione del task')
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
            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-[var(--bg-surface)] z-[120] shadow-2xl flex flex-col"
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
              {/* Festività */}
              {isHoliday(date) && (
                <section>
                  <div className="p-4 rounded-2xl bg-[var(--color-danger-ghost)] border border-[var(--color-danger)]/20 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[var(--bg-surface)] flex items-center justify-center text-[var(--color-danger)] shadow-sm">
                      <Star size={20} fill="currentColor" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-[var(--color-danger)] uppercase tracking-widest">Festività Nazionale</p>
                      <h3 className="text-lg font-bold text-[var(--text-primary)]">{isHoliday(date)}</h3>
                    </div>
                  </div>
                </section>
              )}

              {/* Programma del giorno */}
              {hasProgram && (
                <section>
                  <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-4">Programma</h3>
                  <div className="grid gap-2">
                    {workSched && (
                      <div className="flex items-center gap-3 p-3 rounded-2xl bg-[rgba(180,98,67,0.08)] border border-[rgba(180,98,67,0.1)]">
                        <div className="w-8 h-8 rounded-xl bg-[var(--color-primary-ghost)] flex items-center justify-center text-[var(--color-primary)]">
                          <Briefcase size={16} />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-[var(--color-primary)] uppercase">Lavoro</p>
                          <p className="text-xs font-semibold">{workSched.from} — {workSched.to}</p>
                        </div>
                      </div>
                    )}
                    {studySched && (
                      <div className="flex items-center gap-3 p-3 rounded-2xl bg-[rgba(74,144,217,0.08)] border border-[rgba(74,144,217,0.1)]">
                        <div className="w-8 h-8 rounded-xl bg-[rgba(74,144,217,0.12)] flex items-center justify-center text-[#4a90d9]">
                          <GraduationCap size={16} />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-[#4a90d9] uppercase">Studio</p>
                          <p className="text-xs font-semibold">{studySched.from} — {studySched.to}</p>
                        </div>
                      </div>
                    )}
                    {gymSched && (
                      <div className="flex items-center gap-3 p-3 rounded-2xl bg-[rgba(61,153,112,0.08)] border border-[rgba(61,153,112,0.1)]">
                        <div className="w-8 h-8 rounded-xl bg-[rgba(61,153,112,0.12)] flex items-center justify-center text-[#3d9970]">
                          <Dumbbell size={16} />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-[#3d9970] uppercase">Palestra</p>
                          <p className="text-xs font-semibold">{gymSched.from} — {gymSched.to}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* Abbonamenti / Cose da pagare */}
              {daySubscriptions.length > 0 && (
                <section>
                  <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-4">Cose da Pagare (Abbonamenti)</h3>
                  <div className="grid gap-2">
                    {daySubscriptions.map(sub => (
                      <div key={sub.id} className="flex items-center justify-between p-3.5 rounded-2xl bg-orange-50/70 border border-orange-100 dark:bg-orange-950/10 dark:border-orange-900/20">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0 shadow-sm dark:bg-orange-950 dark:text-orange-400">
                            <CreditCard size={16} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-[var(--text-primary)] truncate">{sub.name}</p>
                            <p className="text-[9px] font-black uppercase text-[var(--text-muted)] tracking-wider mt-0.5">
                              Rinnovo {sub.billing_period === 'yearly' ? 'Annuale' : 'Mensile'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-sm font-black text-orange-600 dark:text-orange-400">€ {parseFloat(sub.amount).toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
              {/* Sezione Attività / Tasks */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">Attività del Giorno</h3>
                  <Button variant="ghost" size="xs" icon={Plus} onClick={() => setAddingTask(true)}>Aggiungi</Button>
                </div>

                <AnimatePresence>
                  {addingTask && (
                    <motion.form 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      onSubmit={handleAddTask} 
                      className="p-4 rounded-2xl border border-[var(--color-primary)]/20 bg-[var(--bg-base)] space-y-3 mb-4 shadow-sm"
                    >
                      <input 
                        type="text" 
                        value={newTaskTitle} 
                        onChange={e => setNewTaskTitle(e.target.value)} 
                        placeholder="Cosa devi fare oggi?" 
                        className="w-full bg-transparent border-b border-[var(--border-subtle)] pb-1.5 text-sm focus:outline-none focus:border-[var(--color-primary)] text-[var(--text-primary)]"
                        autoFocus
                        required
                      />
                      <div className="flex justify-between items-center text-xs">
                        <div className="flex gap-1">
                          {['low', 'medium', 'high'].map(p => (
                            <button
                              key={p}
                              type="button"
                              onClick={() => setNewTaskPriority(p)}
                              className={`px-2 py-1 rounded-lg border text-[10px] font-bold capitalize transition-all ${
                                newTaskPriority === p
                                  ? p === 'high' 
                                    ? 'bg-red-500/10 border-red-500/30 text-red-500 font-extrabold' 
                                    : p === 'medium' 
                                      ? 'bg-orange-500/10 border-orange-500/30 text-orange-500 font-extrabold' 
                                      : 'bg-blue-500/10 border-blue-500/30 text-blue-500 font-extrabold'
                                  : 'border-[var(--border-subtle)] text-[var(--text-muted)]'
                              }`}
                            >
                              {p}
                            </button>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Button type="button" variant="ghost" size="xs" onClick={() => setAddingTask(false)} className="text-[var(--text-muted)] font-bold">Annulla</Button>
                          <Button type="submit" variant="primary" size="xs" className="font-bold">Crea</Button>
                        </div>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>

                <div className="space-y-2">
                  {dayTasks.map(task => {
                    const isHigh = task.priority === 'high'
                    const isMedium = task.priority === 'medium'
                    const isLow = task.priority === 'low'
                    
                    return (
                      <motion.div 
                        key={task.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className={`group p-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-base)] flex items-center justify-between transition-all ${
                          task.completed ? 'opacity-55' : 'hover:border-[var(--color-primary-ghost)]'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <button 
                            type="button"
                            onClick={() => handleToggleTask(task)} 
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                              task.completed 
                                ? 'bg-[var(--color-success)] border-[var(--color-success)] text-white' 
                                : 'border-[var(--text-muted)] hover:border-[var(--color-primary)]'
                            }`}
                          >
                            {task.completed && <Check size={12} strokeWidth={3} />}
                          </button>
                          
                          <div className="min-w-0 flex-1">
                            <p className={`text-xs font-semibold text-[var(--text-primary)] transition-all truncate ${
                              task.completed ? 'line-through text-[var(--text-muted)]' : ''
                            }`}>
                              {task.title}
                            </p>
                            <div className="flex gap-1.5 mt-1 items-center">
                              <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded border ${
                                isHigh 
                                  ? 'bg-red-500/10 border-red-500/20 text-red-500' 
                                  : isMedium 
                                    ? 'bg-orange-500/10 border-orange-500/20 text-orange-500' 
                                    : 'bg-blue-500/10 border-blue-500/20 text-blue-500'
                              }`}>
                                {task.priority}
                              </span>
                            </div>
                          </div>
                        </div>

                        <button 
                          type="button"
                          onClick={() => handleDeleteTask(task.id)} 
                          className="p-1.5 text-[var(--text-muted)] hover:text-[var(--color-danger)] opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0"
                        >
                          <Trash2 size={14} />
                        </button>
                      </motion.div>
                    )
                  })}

                  {dayTasks.length === 0 && (
                    <div className="text-center py-6 text-[var(--text-muted)] border border-dashed border-[var(--border-subtle)] rounded-2xl bg-[var(--bg-base)]/30">
                      <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">Nessuna attività programmata</p>
                    </div>
                  )}
                </div>
              </section>

              {/* Eventi section */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">Eventi</h3>
                  <Button variant="ghost" size="xs" icon={Plus} onClick={onAddEvent}>Aggiungi</Button>
                </div>
                <div className="space-y-3">
                  {dayRecurring.map((re, i) => (
                    <div key={`re-${i}`} className="flex items-center gap-3 p-3 rounded-2xl bg-[rgba(155,89,182,0.08)] border border-[rgba(155,89,182,0.1)]">
                      <div className="w-8 h-8 rounded-xl bg-[rgba(155,89,182,0.12)] flex items-center justify-center text-[#9b59b6]">
                        <Star size={16} fill="currentColor" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-[#9b59b6] uppercase">Ricorrenza Annuale</p>
                        <p className="text-xs font-semibold">🎂 {re.title}</p>
                      </div>
                    </div>
                  ))}

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
                  {dayEvents.length === 0 && dayRecurring.length === 0 && (
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
