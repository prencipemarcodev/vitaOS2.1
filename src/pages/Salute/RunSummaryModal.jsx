import { useState } from 'react'
import { motion } from 'framer-motion'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { formatPace, formatDuration, calcAvgSpeed } from '@/lib/runCalculations'
import RunMap from './RunMap'
import { supabase } from '@/lib/supabase'
import { useNotifications } from '@/hooks/useNotifications'
import { useAppStore } from '@/store/useAppStore'
import { toast } from 'sonner'
import { Map, Trophy, Timer, Flame, TrendingUp, Zap } from 'lucide-react'

function RunSummaryModal({ isOpen, onClose, tracker }) {
  const { pushError } = useNotifications()
  const { userConfig, setUserConfig } = useAppStore()
  const [saving, setSaving] = useState(false)

  if (!tracker) return null

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = {
        date: new Date().toISOString().split('T')[0],
        type: 'corsa',
        duration_minutes: Math.round(tracker.elapsed / 60),
        run_distance_km: parseFloat(tracker.distanceKm.toFixed(3)),
        run_avg_pace: formatPace(tracker.avgPace),
        run_calories: tracker.calories,
        run_max_speed: parseFloat(tracker.maxSpeed.toFixed(2)),
        run_elevation_gain: tracker.elevationGain,
        run_polyline: tracker.polyline,
        run_splits: tracker.splits,
        notes: '',
      }

      const { error } = await supabase.from('workout_sessions').insert(payload)
      if (error) throw error

      const newTotal = (parseFloat(userConfig?.total_run_km_ever) || 0) + tracker.distanceKm
      await supabase.from('user_config').update({ total_run_km_ever: newTotal }).eq('id', userConfig.id)
      setUserConfig({ ...userConfig, total_run_km_ever: newTotal })

      toast.success('Corsa salvata! Grande lavoro! 🏆')
      onClose()
    } catch (err) {
      console.error(err)
      pushError('Errore nel salvataggio')
    } finally {
      setSaving(false)
    }
  }

  const kpis = [
    { label: 'Distanza', value: `${tracker.distanceKm.toFixed(2)}`, unit: 'km', icon: Map },
    { label: 'Tempo', value: formatDuration(tracker.elapsed), unit: 'mm:ss', icon: Timer },
    { label: 'Pace Med.', value: formatPace(tracker.avgPace), unit: '/km', icon: Trophy, highlight: true },
    { label: 'Calorie', value: tracker.calories, unit: 'kcal', icon: Flame },
    { label: 'Dislivello', value: `+${tracker.elevationGain}`, unit: 'm', icon: TrendingUp },
    { label: 'Max Speed', value: tracker.maxSpeed.toFixed(1), unit: 'km/h', icon: Zap },
  ]

  // Calcola il passo migliore per scalare le barre
  const bestPace = tracker.splits.length > 0 
    ? Math.min(...tracker.splits.map(s => s.pace_sec)) 
    : 300

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Riepilogo corsa" className="!max-w-2xl">
      <div className="space-y-6 pt-2">
        {/* Mappa con overlay distanza */}
        <div className="relative rounded-3xl overflow-hidden border border-[var(--border-subtle)] bg-gray-100 h-48">
          <RunMap polyline={tracker.polyline} isLive={false} height={192} />
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-xl border border-[var(--border-subtle)] shadow-sm">
            <p className="text-[10px] font-black">{tracker.distanceKm.toFixed(2)} km</p>
          </div>
        </div>

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
        <div className="space-y-4">
          <h4 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em] px-1">Km Splits</h4>
          <div className="space-y-3">
            {tracker.splits.map((s) => (
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
            {/* Ultimo split incompleto se presente */}
            {tracker.distanceKm % 1 > 0.1 && (
              <div className="flex items-center gap-4 opacity-60">
                <span className="text-[10px] font-bold w-10 text-[var(--text-muted)]">+{ (tracker.distanceKm % 1).toFixed(2) }</span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-200" style={{ width: '40%' }} />
                </div>
                <div className="text-right w-24">
                  <span className="text-[10px] font-black">{formatPace(tracker.avgPace)}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-4">
          <button 
            onClick={onClose}
            className="flex-1 py-4 bg-[var(--bg-elevated)] text-[var(--text-muted)] rounded-2xl font-bold active:scale-95 transition-all"
          >
            Scarta
          </button>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex-[2] py-4 bg-orange-500 text-white rounded-2xl font-black shadow-lg shadow-orange-100 active:scale-95 transition-all disabled:opacity-50"
          >
            {saving ? 'Salvataggio...' : 'Salva corsa'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default RunSummaryModal
