import { Edit2, Trash2, Clock, StickyNote } from 'lucide-react'
import { formatDuration } from '@/lib/formatters'
import { supabase } from '@/lib/supabase'
import { useFirmeStore } from '@/store/useFirmeStore'
import { toast } from 'sonner'
import { format, parseISO } from 'date-fns'
import { it } from 'date-fns/locale'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'

function WorkLog({ sessions, onEdit }) {
  const { removeSession } = useFirmeStore()

  const handleDelete = async (id) => {
    if (!confirm('Sei sicuro di voler eliminate questa sessione?')) return
    
    try {
      const { error } = await supabase.from('work_sessions').delete().eq('id', id)
      if (error) throw error
      removeSession(id)
      toast.success('Sessione eliminata')
    } catch (err) {
      toast.error('Errore nell\'eliminazione')
    }
  }

  if (sessions.length === 0) {
    return (
      <Card padding="lg" className="flex flex-col items-center justify-center text-center">
        <Clock size={40} className="text-[var(--text-muted)] mb-3 opacity-20" />
        <p className="text-sm font-medium text-[var(--text-secondary)]">Nessuna sessione registrata</p>
        <p className="text-xs text-[var(--text-muted)] mt-1">Usa il tasto + per aggiungere la tua prima ora.</p>
      </Card>
    )
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-bold text-[var(--text-primary)] mb-3 px-1">Ultime sessioni</h3>
      {sessions.map((session) => (
        <Card key={session.id} padding="sm" className="group hover:bg-[var(--bg-elevated)] transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-center justify-center w-12 h-12 bg-[var(--bg-base)] rounded-xl border border-[var(--border-subtle)] shrink-0">
                <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] leading-none mb-1">
                  {format(parseISO(session.date), 'MMM', { locale: it })}
                </span>
                <span className="text-lg font-bold text-[var(--text-primary)] leading-none">
                  {format(parseISO(session.date), 'dd')}
                </span>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-bold text-[var(--text-primary)]">
                    {formatDuration(session.duration_minutes)}
                  </p>
                  {session.is_manual && (
                    <Badge variant="warning" className="text-[8px] px-1 py-0 uppercase">Manuale</Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 text-[10px] text-[var(--text-muted)] font-medium">
                  <span className="flex items-center gap-1">
                    <Clock size={10} /> {session.start_time.substring(0, 5)} — {session.end_time.substring(0, 5)}
                  </span>
                  {session.notes && (
                    <span className="flex items-center gap-1 italic truncate max-w-[150px]">
                      <StickyNote size={10} /> {session.notes}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => onEdit(session)}
                className="p-2 rounded-lg text-[var(--text-muted)] hover:bg-white hover:text-[var(--color-primary)] shadow-sm"
              >
                <Edit2 size={14} />
              </button>
              <button 
                onClick={() => handleDelete(session.id)}
                className="p-2 rounded-lg text-[var(--text-muted)] hover:bg-white hover:text-[var(--color-danger)] shadow-sm"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

export default WorkLog
