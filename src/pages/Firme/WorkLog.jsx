import { Trash2, Edit2, AlertCircle, Info } from 'lucide-react'
import { formatDuration } from '@/lib/formatters'
import { supabase } from '@/lib/supabase'
import { useFirmeStore } from '@/store/useFirmeStore'
import { useNotifications } from '@/hooks/useNotifications'
import { toast } from 'sonner'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'

import { calculateOvertime } from '@/lib/workCalculations'

function WorkLog({ sessions, onEdit, userConfig }) {
  const { removeSession } = useFirmeStore()
  const { pushError } = useNotifications()

  // Programma di default
  const defaultSchedule = {
    monday: { start: '09:00', end: '18:00', active: true },
    tuesday: { start: '09:00', end: '18:00', active: true },
    wednesday: { start: '09:00', end: '18:00', active: true },
    thursday: { start: '09:00', end: '18:00', active: true },
    friday: { start: '09:00', end: '18:00', active: true },
    saturday: { start: '09:00', end: '13:00', active: false },
    sunday: { start: '09:00', end: '13:00', active: false },
  }
  const schedule = userConfig?.work_schedule || defaultSchedule

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
      <h3 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest px-1 mb-2">Storico Registrazioni</h3>
      {sessions.map((session) => {
        const { overtime } = calculateOvertime(session.date, session.check_in, session.check_out, schedule)
        
        return (
          <Card key={session.id} padding="sm" className="group hover:bg-[var(--bg-elevated)] transition-colors border border-transparent hover:border-[var(--border-subtle)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--bg-base)] flex flex-col items-center justify-center border border-[var(--border-subtle)] shrink-0 shadow-sm">
                  <span className="text-[11px] font-bold text-[var(--text-primary)] leading-none">
                    {new Date(session.date).toLocaleDateString('it-IT', { day: '2-digit' })}
                  </span>
                  <span className="text-[8px] font-bold text-[var(--text-muted)] uppercase">
                    {new Date(session.date).toLocaleDateString('it-IT', { month: 'short' })}
                  </span>
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-[var(--text-primary)]">
                      {formatDuration(session.duration_minutes)}
                    </p>
                    {overtime > 0 && <Badge variant="warning" className="text-[7px] px-1 py-0 uppercase">+{formatDuration(overtime)} Extra</Badge>}
                    {session.manual_entry && <Badge variant="subtle" className="text-[7px] px-1 py-0 uppercase bg-[var(--bg-base)]">Manuale</Badge>}
                  </div>
                <div className="flex items-center gap-1.5 text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-tight">
                  <span>{session.check_in ? session.check_in.substring(0, 5) : '--:--'}</span>
                  <span className="opacity-30">→</span>
                  <span>{session.check_out ? session.check_out.substring(0, 5) : '--:--'}</span>
                </div>
              </div>
            </div>

            {/* Azioni: Sempre visibili su mobile, hover su desktop */}
            <div className="flex items-center gap-1 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => onEdit(session)}
                className="p-2 text-[var(--text-muted)] hover:text-[var(--color-primary)] active:scale-95 transition-all"
                title="Modifica"
              >
                <Edit2 size={15} />
              </button>
              <button 
                onClick={() => handleDelete(session.id)}
                className="p-2 text-[var(--text-muted)] hover:text-[var(--color-danger)] active:scale-95 transition-all"
                title="Elimina"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        </Card>
      )
    })}
    </div>
  )
}

export default WorkLog
