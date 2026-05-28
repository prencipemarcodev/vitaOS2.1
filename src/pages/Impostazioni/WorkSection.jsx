import { useCallback, useRef, useEffect } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { supabase } from '@/lib/supabase'
import Card from '@/components/ui/Card'
import TimeBlockSelector from '@/components/ui/TimeBlockSelector'
import { Timer } from 'lucide-react'

function Toggle({ checked, onChange, label, description, icon: Icon, iconColor = 'text-[var(--color-primary)]' }) {
  return (
    <div className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:bg-[var(--bg-surface)] transition-all text-left">
      <div className="flex items-start gap-3">
        {Icon && (
          <div className={`w-8 h-8 rounded-xl bg-black/5 dark:bg-white/5 flex items-center justify-center shrink-0 ${iconColor}`}>
            <Icon size={16} />
          </div>
        )}
        <div>
          <p className="text-xs font-bold text-[var(--text-primary)] leading-tight">{label}</p>
          {description && <p className="text-[10px] text-[var(--text-muted)] mt-1 font-medium leading-normal">{description}</p>}
        </div>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`w-10 h-6 rounded-full p-0.5 transition-colors relative shrink-0 ${
          checked ? 'bg-[var(--color-primary)]' : 'bg-black/10 dark:bg-white/10'
        }`}
      >
        <div
          className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform transform ${
            checked ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  )
}

function WorkSection() {
  const { userConfig, setUserConfig } = useAppStore()

  const pendingUpdatesRef = useRef({})
  const timeoutRef = useRef(null)

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const save = useCallback((field, value) => {
    if (!userConfig?.id) return

    // 1. Instantly update Zustand store so local UI is 100% snappy and updates at 60fps!
    setUserConfig({ ...userConfig, [field]: value })

    // 2. Queue the updates to debounce network request
    pendingUpdatesRef.current[field] = value

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(async () => {
      const updates = { ...pendingUpdatesRef.current }
      pendingUpdatesRef.current = {} // clear queue
      try {
        await supabase.from('user_config').update(updates).eq('id', userConfig.id)
      } catch (err) {
        console.error('Failed to update config in Supabase:', err)
      }
    }, 600) // 600ms debounce
  }, [userConfig, setUserConfig])

  return (
    <div className="space-y-6">

      {/* Lavoro */}
      <Card padding="lg" className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[var(--color-primary)]" />
          <p className="text-sm font-medium text-[var(--text-primary)]">Orario lavorativo</p>
        </div>
        <TimeBlockSelector
          mode="work"
          value={userConfig?.work_schedule || {}}
          onChange={(v) => save('work_schedule', v)}
        />
      </Card>

      {/* Controllo Sessioni Attive (Avviso prolungato) */}
      <Card padding="lg" className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: 'var(--color-primary)' }} />
          <p className="text-sm font-medium text-[var(--text-primary)]">Controllo Sessioni Attive</p>
        </div>
        
        <Toggle
          checked={userConfig?.work_session_alert_enabled ?? true}
          onChange={(v) => save('work_session_alert_enabled', v)}
          label="Avviso sessione prolungata"
          description="Ti invia una notifica in-app e di sistema se lasci il timer attivo da oltre il tuo consueto orario per evitare dimenticanze."
          icon={Timer}
          iconColor="text-[var(--color-primary)]"
        />

        {(userConfig?.work_session_alert_enabled ?? true) && (
          <div className="p-4 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-between gap-4 text-left">
            <div className="space-y-1">
              <p className="text-xs font-bold text-[var(--text-primary)]">Soglia di avviso</p>
              <p className="text-[10px] text-[var(--text-muted)] font-medium leading-normal">
                Imposta dopo quante ore di registrazione continua ricevere l'avviso (orario consigliato calcolato: {userConfig?.daily_hours || 8}h).
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <input
                type="number"
                min={1}
                max={24}
                step={0.5}
                value={userConfig?.work_session_alert_hours ?? userConfig?.daily_hours ?? 8}
                onChange={(e) => save('work_session_alert_hours', parseFloat(e.target.value) || 8)}
                className="w-20 bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-xl px-3 py-1.5 text-center text-xs font-black focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-ghost)]"
              />
              <span className="text-xs font-bold text-[var(--text-secondary)]">ore</span>
            </div>
          </div>
        )}
      </Card>

      {/* Studio */}
      <Card padding="lg" className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: '#9b59b6' }} />
          <p className="text-sm font-medium text-[var(--text-primary)]">Orario studio</p>
        </div>
        <TimeBlockSelector
          mode="study"
          value={userConfig?.study_schedule || {}}
          onChange={(v) => save('study_schedule', v)}
        />
      </Card>

      {/* Palestra */}
      <Card padding="lg" className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: '#3d9970' }} />
          <p className="text-sm font-medium text-[var(--text-primary)]">Orario palestra</p>
        </div>
        <TimeBlockSelector
          mode="gym"
          value={userConfig?.gym_schedule || {}}
          onChange={(v) => save('gym_schedule', v)}
        />
      </Card>
    </div>
  )
}

export default WorkSection
