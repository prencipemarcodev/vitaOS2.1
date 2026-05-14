import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { formatPace, formatDuration, calcAvgSpeed } from '@/lib/runCalculations'
import RunMap from './RunMap'
import { supabase } from '@/lib/supabase'
import { useNotifications } from '@/hooks/useNotifications'
import { useAppStore } from '@/store/useAppStore'
import { toast } from 'sonner'
import { Map, Trophy, Timer, Flame, TrendingUp } from 'lucide-react'

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
        run_max_speed: parseFloat((tracker.currentSpeed * 3.6).toFixed(2)),
        run_elevation_gain: tracker.elevationGain,
        run_polyline: tracker.polyline,
        run_splits: tracker.splits,
        notes: '',
      }

      const { data, error } = await supabase.from('workout_sessions').insert(payload).select().single()
      if (error) throw error

      // Aggiorna km totali nel config
      const newTotal = (parseFloat(userConfig?.total_run_km_ever) || 0) + tracker.distanceKm
      const { error: configError } = await supabase
        .from('user_config')
        .update({ total_run_km_ever: newTotal })
        .eq('id', userConfig.id)
      
      if (!configError) {
        setUserConfig({ ...userConfig, total_run_km_ever: newTotal })
      }

      toast.success('Corsa salvata con successo! 🏃‍♂️')
      onClose()
    } catch (err) {
      console.error(err)
      pushError('Impossibile salvare la corsa')
    } finally {
      setSaving(false)
    }
  }

  const stats = [
    { label: 'Distanza', value: `${tracker.distanceKm.toFixed(2)} km`, icon: Map, color: '#4a90d9' },
    { label: 'Tempo', value: formatDuration(tracker.elapsed), icon: Timer, color: '#3d9970' },
    { label: 'Passo Medio', value: formatPace(tracker.avgPace), icon: Trophy, color: '#ff851b' },
    { label: 'Calorie', value: `${tracker.calories} kcal`, icon: Flame, color: '#e05252' },
  ]

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Riepilogo Corsa" className="!max-w-2xl">
      <div className="space-y-6">
        {/* Mappa Finale */}
        <div className="rounded-2xl overflow-hidden border border-[var(--border-subtle)] shadow-md">
          <RunMap polyline={tracker.polyline} isLive={false} height={250} />
        </div>

        {/* Grid Statistiche */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="p-4 bg-[var(--bg-base)] rounded-2xl border border-[var(--border-subtle)] flex flex-col items-center text-center">
              <div className="w-8 h-8 rounded-full mb-2 flex items-center justify-center" style={{ backgroundColor: `${s.color}15`, color: s.color }}>
                <s.icon size={16} />
              </div>
              <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase mb-0.5">{s.label}</p>
              <p className="text-sm font-bold text-[var(--text-primary)]">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Tabella Splits (KM per KM) */}
        {tracker.splits.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest px-1">Tempi Parziali (KM)</h4>
            <div className="bg-[var(--bg-base)] rounded-2xl border border-[var(--border-subtle)] overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--bg-elevated)] text-[var(--text-muted)] font-bold uppercase text-[9px]">
                  <tr>
                    <th className="px-4 py-2">Km</th>
                    <th className="px-4 py-2">Passo</th>
                    <th className="px-4 py-2">Tempo Totale</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {tracker.splits.map((s) => (
                    <tr key={s.km}>
                      <td className="px-4 py-2 font-bold">{s.km}</td>
                      <td className="px-4 py-2 text-[var(--color-primary)] font-bold">{formatPace(s.pace_sec)}</td>
                      <td className="px-4 py-2 text-[var(--text-muted)]">{formatDuration(s.elapsed_sec)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" onClick={onClose}>Scarta</Button>
          <Button variant="primary" loading={saving} onClick={handleSave}>Salva Corsa</Button>
        </div>
      </div>
    </Modal>
  )
}

export default RunSummaryModal
