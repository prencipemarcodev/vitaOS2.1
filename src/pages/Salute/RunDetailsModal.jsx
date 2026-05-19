import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import Modal from '@/components/ui/Modal'
import { formatPace, formatDuration, calcElevationData } from '@/lib/runCalculations'
import RunMap from './RunMap'
import { supabase } from '@/lib/supabase'
import { useNotifications } from '@/hooks/useNotifications'
import { useAppStore } from '@/store/useAppStore'
import { useHealthStore } from '@/store/useHealthStore'
import { toast } from 'sonner'
import { Map, Trophy, Timer, Flame, TrendingUp, Zap, Trash2, Calendar } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { it } from 'date-fns/locale'

function RunDetailsModal({ isOpen, onClose, session }) {
  const { pushError } = useNotifications()
  const { userConfig, setUserConfig } = useAppStore()
  const { removeWorkoutSession } = useHealthStore()
  const [deleting, setDeleting] = useState(false)

  if (!session) return null

  const splits = useMemo(() => session.run_splits || [], [session])
  const polyline = useMemo(() => session.run_polyline || [], [session])
  const distanceKm = session.run_distance_km || 0
  const elapsed = useMemo(() => {
    if (splits.length > 0) {
      return splits[splits.length - 1].elapsed_sec
    }
    return (session.duration_minutes || 0) * 60
  }, [session, splits])

  const elevation = useMemo(() => {
    return calcElevationData(polyline)
  }, [polyline])

  const handleDelete = async () => {
    if (!window.confirm('Sei sicuro di voler eliminare questa corsa dallo storico? Questa azione è irreversibile.')) {
      return
    }
    setDeleting(true)
    try {
      const { error } = await supabase
        .from('workout_sessions')
        .delete()
        .eq('id', session.id)

      if (error) throw error

      // Ricalcola il totale km
      const newTotal = Math.max(0, (parseFloat(userConfig?.total_run_km_ever) || 0) - distanceKm)
      await supabase
        .from('user_config')
        .update({ total_run_km_ever: newTotal })
        .eq('id', userConfig.id)
      
      setUserConfig({ ...userConfig, total_run_km_ever: newTotal })
      removeWorkoutSession(session.id)
      
      toast.success('Corsa eliminata con successo.')
      onClose()
    } catch (err) {
      console.error(err)
      pushError('Errore nell\'eliminazione della corsa')
    } finally {
      setDeleting(false)
    }
  }

  const formattedDate = useMemo(() => {
    try {
      return format(parseISO(session.date), 'dd MMMM yyyy', { locale: it })
    } catch (e) {
      return session.date
    }
  }, [session.date])

  const kpis = [
    { label: 'Distanza', value: `${distanceKm.toFixed(2)}`, unit: 'km', icon: Map },
    { label: 'Tempo', value: formatDuration(elapsed), unit: 'mm:ss', icon: Timer },
    { label: 'Pace Med.', value: session.run_avg_pace || '--:--', unit: '/km', icon: Trophy, highlight: true },
    { label: 'Calorie', value: session.run_calories || 0, unit: 'kcal', icon: Flame },
    { label: 'Dislivello', value: elevation.loss > 0 ? `+${elevation.gain} / -${elevation.loss}` : `+${elevation.gain}`, unit: 'm', icon: TrendingUp },
    { label: 'Max Speed', value: (session.run_max_speed || 0).toFixed(1), unit: 'km/h', icon: Zap },
  ]

  // Calcola il passo migliore per scalare le barre
  const bestPace = splits.length > 0 
    ? Math.min(...splits.map(s => s.pace_sec)) 
    : 300

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Dettaglio corsa" className="!max-w-2xl">
      <div className="space-y-6 pt-2">
        {/* Header con Data */}
        <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider px-1">
          <Calendar size={14} className="text-orange-500" />
          <span>Corsa del {formattedDate}</span>
        </div>

        {/* Mappa con overlay distanza */}
        {polyline.length > 0 && (
          <div className="relative rounded-3xl overflow-hidden border border-[var(--border-subtle)] bg-gray-100 h-48">
            <RunMap polyline={polyline} isLive={false} height={192} />
            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-xl border border-[var(--border-subtle)] shadow-sm">
              <p className="text-[10px] font-black">{distanceKm.toFixed(2)} km</p>
            </div>
          </div>
        )}

        {/* Griglia KPI */}
        <div className="grid grid-cols-3 gap-3">
          {kpis.map((kpi) => (
            <div key={kpi.label} className="p-3 bg-[var(--bg-elevated)] rounded-2xl border border-[var(--border-subtle)] flex flex-col items-center text-center">
              <p className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">{kpi.label}</p>
              <p className={`text-sm font-black ${kpi.highlight ? 'text-orange-500' : 'text-[var(--text-primary)]'}`}>
                {kpi.value} <span className="text-[9px] font-bold text-[var(--text-muted)]">{kpi.unit}</span>
              </p>
            </div>
          ))}
        </div>

        {/* KM SPLITS */}
        {splits.length > 0 && (
          <div className="space-y-4">
            <h4 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em] px-1">Km Splits</h4>
            <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
              {splits.map((s) => (
                <div key={s.km} className="flex items-center gap-4">
                  <span className="text-[10px] font-bold w-10 text-[var(--text-muted)]">km {s.km}</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (bestPace / s.pace_sec) * 100)}%` }}
                      className="h-full bg-orange-400"
                    />
                  </div>
                  <div className="text-right w-24">
                    <span className="text-[10px] font-black">{formatPace(s.pace_sec)}</span>
                    <span className="text-[9px] text-[var(--text-muted)] ml-1">({formatDuration(s.elapsed_sec)})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-4">
          <button 
            onClick={onClose}
            className="flex-1 py-4 bg-[var(--bg-elevated)] text-[var(--text-muted)] rounded-2xl font-bold active:scale-95 transition-all border border-[var(--border-subtle)]"
          >
            Chiudi
          </button>
          <button 
            onClick={handleDelete}
            disabled={deleting}
            className="flex-1 py-4 bg-red-50 border border-red-200 text-red-600 rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
          >
            <Trash2 size={16} />
            {deleting ? 'Eliminazione...' : 'Elimina corsa'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default RunDetailsModal
