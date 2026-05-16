import { useCallback, useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { supabase } from '@/lib/supabase'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import { Zap, Battery, Navigation, Info } from 'lucide-react'
import clsx from 'clsx'

const GPS_PRESETS = [
  {
    id: 'balanced',
    label: 'Bilanciata',
    description: 'Buona precisione, consumi normali',
    icon: Battery,
    color: '#3d9970',
    jitter: 6,
    timeout: 10000,
    keepalive: false,
    keepalive_interval: 2000,
  },
  {
    id: 'high',
    label: 'Alta',
    description: 'Precisione aumentata, più consumo',
    icon: Navigation,
    color: '#4a90d9',
    jitter: 3,
    timeout: 5000,
    keepalive: true,
    keepalive_interval: 2000,
  },
  {
    id: 'max',
    label: 'Massima',
    description: 'Massima fedeltà, batteria ridotta',
    icon: Zap,
    color: '#e05252',
    jitter: 1,
    timeout: 3000,
    keepalive: true,
    keepalive_interval: 1000,
  },
]

function GpsSection({ userConfig, save }) {
  const currentPreset = userConfig?.gps_preset || 'balanced'
  const jitter = userConfig?.gps_jitter_meters ?? 6
  const keepalive = userConfig?.gps_keepalive ?? false
  const keepaliveInterval = userConfig?.gps_keepalive_interval_ms ?? 2000

  const applyPreset = (preset) => {
    save('gps_preset', preset.id)
    save('gps_jitter_meters', preset.jitter)
    save('gps_keepalive', preset.keepalive)
    save('gps_keepalive_interval_ms', preset.keepalive_interval)
  }

  return (
    <Card padding="lg" className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-[var(--text-primary)]">Precisione GPS Corsa</p>
        <div className="flex items-center gap-1 text-[9px] font-bold text-[var(--text-muted)] bg-[var(--bg-base)] px-2 py-1 rounded-lg border border-[var(--border-subtle)]">
          <Info size={10} />
          Influisce sulla batteria
        </div>
      </div>

      {/* Preset cards */}
      <div className="grid grid-cols-3 gap-2">
        {GPS_PRESETS.map((preset) => {
          const isActive = currentPreset === preset.id
          return (
            <button
              key={preset.id}
              onClick={() => applyPreset(preset)}
              className={clsx(
                'flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all text-center',
                isActive
                  ? 'shadow-md scale-[1.02]'
                  : 'border-[var(--border-subtle)] bg-[var(--bg-base)] hover:border-[var(--border-default)]'
              )}
              style={isActive ? {
                borderColor: preset.color,
                backgroundColor: `${preset.color}10`,
              } : {}}
            >
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${preset.color}20`, color: preset.color }}
              >
                <preset.icon size={16} />
              </div>
              <div>
                <p className="text-[11px] font-black" style={{ color: isActive ? preset.color : 'var(--text-primary)' }}>
                  {preset.label}
                </p>
                <p className="text-[9px] text-[var(--text-muted)] leading-tight mt-0.5">
                  {preset.description}
                </p>
              </div>
            </button>
          )
        })}
      </div>

      {/* Divider */}
      <div className="h-px bg-[var(--border-subtle)]" />

      {/* Advanced settings */}
      <div className="space-y-4">
        <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Impostazioni avanzate</p>

        {/* Jitter filter slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-[var(--text-secondary)]">Filtro jitter GPS</label>
            <span className="text-xs font-black text-[var(--color-primary)]">{jitter}m</span>
          </div>
          <input
            type="range"
            min={1}
            max={15}
            step={1}
            value={jitter}
            onChange={(e) => save('gps_jitter_meters', parseInt(e.target.value))}
            className="w-full accent-[var(--color-primary)]"
          />
          <div className="flex justify-between text-[9px] text-[var(--text-muted)] font-bold">
            <span>1m — Massima precisione</span>
            <span>15m — Risparmio batteria</span>
          </div>
          <p className="text-[10px] text-[var(--text-muted)] leading-relaxed">
            Distanza minima tra due punti GPS. Valori bassi catturano più dettagli ma possono introdurre errori di jitter.
          </p>
        </div>

        {/* iOS keep-alive toggle */}
        <div className="flex items-start justify-between gap-4 p-3 rounded-2xl bg-[var(--bg-base)] border border-[var(--border-subtle)]">
          <div className="flex-1">
            <p className="text-xs font-bold text-[var(--text-primary)]">Keep-alive GPS (iOS)</p>
            <p className="text-[10px] text-[var(--text-muted)] mt-0.5 leading-relaxed">
              Previene il throttling di Safari in background. Consuma più batteria ma garantisce aggiornamenti GPS costanti.
            </p>
          </div>
          <button
            onClick={() => save('gps_keepalive', !keepalive)}
            className={clsx(
              'shrink-0 w-11 h-6 rounded-full relative transition-colors mt-0.5',
              keepalive ? 'bg-[var(--color-primary)]' : 'bg-[var(--border-default)]'
            )}
          >
            <span className={clsx(
              'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform',
              keepalive ? 'translate-x-5' : 'translate-x-0.5'
            )} />
          </button>
        </div>

        {/* Keep-alive interval (only if enabled) */}
        {keepalive && (
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[var(--text-secondary)]">Frequenza keep-alive</label>
            <div className="flex gap-2">
              {[
                { ms: 1000, label: '1s — Massima' },
                { ms: 2000, label: '2s — Alta' },
                { ms: 5000, label: '5s — Media' },
              ].map(opt => (
                <button
                  key={opt.ms}
                  onClick={() => save('gps_keepalive_interval_ms', opt.ms)}
                  className={clsx(
                    'flex-1 py-2 text-[10px] font-bold border rounded-xl transition-all',
                    keepaliveInterval === opt.ms
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary-ghost)] text-[var(--color-primary)]'
                      : 'border-[var(--border-subtle)] text-[var(--text-muted)] hover:border-[var(--text-secondary)]'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}

function HealthSection() {
  const { userConfig, setUserConfig } = useAppStore()

  const save = useCallback(async (field, value) => {
    if (!userConfig?.id) return
    setUserConfig({ ...userConfig, [field]: value })
    await supabase.from('user_config').update({ [field]: value }).eq('id', userConfig.id)
  }, [userConfig, setUserConfig])

  const [localWeight, setLocalWeight] = useState(userConfig?.weight_kg?.toString() || '')

  const handleWeightBlur = () => {
    const v = parseFloat(localWeight) || null
    save('weight_kg', v)
    save('weight_updated_at', new Date().toISOString().split('T')[0])
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-medium text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
          Salute
        </h3>
        <p className="text-sm text-[var(--text-muted)] mt-0.5">
          Obiettivi di allenamento, corsa e impostazioni GPS
        </p>
      </div>

      {/* Obiettivi settimanali */}
      <Card padding="lg" className="space-y-4">
        <p className="text-sm font-medium text-[var(--text-primary)]">Obiettivi</p>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Allenamenti/settimana"
            type="number"
            min={0}
            max={14}
            value={userConfig?.workout_weekly_goal || ''}
            onChange={(e) => save('workout_weekly_goal', parseInt(e.target.value) || 0)}
            helper="Sessioni settimanali"
          />
          <Input
            label="Km corsa/mese"
            type="number"
            min={0}
            step="0.1"
            value={userConfig?.run_monthly_goal_km || ''}
            onChange={(e) => save('run_monthly_goal_km', parseFloat(e.target.value) || 0)}
            helper="Obiettivo mensile"
          />
        </div>
      </Card>

      {/* GPS Settings */}
      <GpsSection userConfig={userConfig} save={save} />

      {/* Storico totale */}
      <Card padding="lg" className="space-y-3">
        <p className="text-sm font-medium text-[var(--text-primary)]">Storico</p>
        <Input
          label="Km totali corsa (carriera)"
          type="number"
          step="0.1"
          value={userConfig?.total_run_km_ever || ''}
          onChange={(e) => save('total_run_km_ever', parseFloat(e.target.value) || 0)}
          helper="Tutti i km che hai corso finora nella vita"
        />
      </Card>

      {/* Peso attuale */}
      <Card padding="lg" className="space-y-3">
        <p className="text-sm font-medium text-[var(--text-primary)]">Peso attuale</p>
        <Input
          label="Peso (kg)"
          type="number"
          step="0.1"
          suffix="kg"
          value={localWeight}
          onChange={(e) => setLocalWeight(e.target.value)}
          onBlur={handleWeightBlur}
        />
      </Card>
    </div>
  )
}

export default HealthSection
