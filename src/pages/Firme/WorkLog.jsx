import { Trash2, Edit2, AlertCircle, Info } from 'lucide-react'
import { formatDuration } from '@/lib/formatters'
import { supabase } from '@/lib/supabase'
import { useFirmeStore } from '@/store/useFirmeStore'
import { useNotifications } from '@/hooks/useNotifications'
import { toast } from 'sonner'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'

function WorkLog({ sessions, onEdit }) {
  const { removeSession } = useFirmeStore()
  const { pushError } = useNotifications()

  const handleDelete = async (id) => {
    if (!confirm('Eliminare questa sessione?')) return
    const { error } = await supabase.from('work_sessions').delete().eq('id', id)
    if (error) {
      pushError('Errore nell\'eliminazione')
    } else {
      removeSession(id)
      toast.success('Sessione eliminata')
    }
  }

  if (sessions.length === 0) {
    return (
      <Card padding="lg" className="flex flex-col items-center justify-center text-center opacity-40">
        <Info size={32} className="mb-2" />
        <p className="text-xs font-bold">Nessuna sessione registrata questo mese</p>
      </Card>
    )
  }

  return (
    <div className="space-y-2">
      {sessions.map((session) => (
        <Card key={session.id} padding="sm" className="group hover:bg-[var(--bg-elevated)] transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--bg-base)] flex flex-col items-center justify-center border border-[var(--border-subtle)] shrink-0">
                <span className="text-[10px] font-bold leading-none">
                  {new Date(session.date).toLocaleDateString('it-IT', { day: '2-digit' })}
                </span>
                <span className="text-[8px] font-bold text-[var(--text-muted)] uppercase">
                  {new Date(session.date).toLocaleDateString('it-IT', { month: 'short' })}
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-[var(--text-primary)]">
                    {formatDuration(session.duration_minutes)}
                  </p>
                  {session.manual_entry && <Badge variant="subtle" className="text-[7px] px-1 py-0 uppercase">Manuale</Badge>}
                </div>
                <p className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider">
                  {session.check_in ? session.check_in.substring(0, 5) : '--:--'} - {session.check_out ? session.check_out.substring(0, 5) : '--:--'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => onEdit(session)}
                className="p-1.5 text-[var(--text-muted)] hover:text-[var(--color-primary)] transition-colors"
              >
                <Edit2 size={14} />
              </button>
              <button 
                onClick={() => handleDelete(session.id)}
                className="p-1.5 text-[var(--text-muted)] hover:text-[var(--color-danger)] transition-colors"
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
