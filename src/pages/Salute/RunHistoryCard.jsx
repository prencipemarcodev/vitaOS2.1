import { useMemo, useState } from 'react'
import Card from '@/components/ui/Card'
import { Calendar, ChevronRight, Trophy, Timer, Eye } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { it } from 'date-fns/locale'

function RunHistoryCard({ sessions, onSelectSession }) {
  const [showAll, setShowAll] = useState(false)

  const runs = useMemo(() => {
    return sessions
      .filter(s => s.type === 'corsa')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [sessions])

  const displayedRuns = useMemo(() => {
    if (showAll) return runs
    return runs.slice(0, 4)
  }, [runs, showAll])

  if (runs.length === 0) {
    return (
      <Card padding="lg" className="text-center flex flex-col items-center justify-center py-8">
        <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 mb-3 animate-pulse">
          <Trophy size={20} />
        </div>
        <h4 className="text-xs font-bold text-[var(--text-primary)] mb-1">Nessuna corsa registrata</h4>
        <p className="text-[10px] text-[var(--text-muted)] max-w-[200px] leading-relaxed">
          Le corse che completerai e salverai appariranno qui nello storico.
        </p>
      </Card>
    )
  }

  return (
    <Card padding="md" className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Cronologia Corse</h3>
          <p className="text-[8px] text-[var(--text-muted)] font-bold uppercase tracking-wider mt-0.5">
            {runs.length} {runs.length === 1 ? 'attività registrata' : 'attività registrate'}
          </p>
        </div>
        {runs.length > 4 && (
          <button 
            onClick={() => setShowAll(!showAll)}
            className="text-[10px] font-bold text-[var(--color-primary)] hover:opacity-85"
          >
            {showAll ? 'Mostra meno' : 'Vedi tutto'}
          </button>
        )}
      </div>

      <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
        {displayedRuns.map((run) => {
          let formattedDate = run.date
          try {
            formattedDate = format(parseISO(run.date), 'dd MMM yyyy', { locale: it })
          } catch (e) {}

          const durationText = run.duration_minutes 
            ? `${run.duration_minutes} min` 
            : '-- min'

          return (
            <div 
              key={run.id}
              onClick={() => onSelectSession(run)}
              className="group flex items-center justify-between p-3 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-orange-500/30 hover:shadow-sm cursor-pointer transition-all active:scale-[0.99]"
            >
              <div className="flex items-center gap-3">
                {/* Icon/Visual styling */}
                <div className="w-9 h-9 rounded-xl bg-orange-50/50 flex items-center justify-center text-orange-500 shrink-0 group-hover:bg-orange-50 transition-colors">
                  <Trophy size={16} />
                </div>
                
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-[var(--text-primary)]">
                      {parseFloat(run.run_distance_km || 0).toFixed(2)} km
                    </span>
                    <span className="w-1 h-1 rounded-full bg-[var(--border-subtle)]" />
                    <span className="text-[9px] text-[var(--text-muted)] font-semibold flex items-center gap-0.5">
                      <Calendar size={10} className="shrink-0" />
                      {formattedDate}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-[9px] text-[var(--text-muted)] font-semibold flex items-center gap-0.5">
                      <Timer size={10} className="shrink-0" />
                      {durationText}
                    </span>
                    <span className="text-[9px] text-[var(--text-muted)] font-semibold flex items-center gap-0.5">
                      <Trophy size={10} className="shrink-0 text-orange-400" />
                      {run.run_avg_pace || '--:--'}/km
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <span className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                  Dettagli <Eye size={10} />
                </span>
                <ChevronRight size={16} className="text-[var(--text-muted)] group-hover:text-orange-500 transition-colors" />
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

export default RunHistoryCard
