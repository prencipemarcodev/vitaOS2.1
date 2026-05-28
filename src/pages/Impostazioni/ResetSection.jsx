import { useState } from 'react'
import { AlertTriangle, Trash2, RefreshCw, Download } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { supabase } from '@/lib/supabase'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import { toast } from 'sonner'

const exportOptions = [
  { key: 'user_config', label: 'Profilo e Conti Personalizzati', category: 'Configurazioni' },
  { key: 'finance_categories', label: 'Categorie di Spesa', category: 'Configurazioni' },
  { key: 'notifications_read', label: 'Stato Lettura Notifiche', category: 'Configurazioni' },
  
  { key: 'transactions', label: 'Movimenti e Giroconti', category: 'Finanze e Risparmi' },
  { key: 'saving_plans', label: 'Piani di Risparmio', category: 'Finanze e Risparmi' },
  { key: 'saving_movements', label: 'Movimenti Salvadanaio', category: 'Finanze e Risparmi' },
  
  { key: 'work_sessions', label: 'Sessioni Lavoro (e Pausa Pranzo)', category: 'Lavoro' },
  
  { key: 'workout_sessions', label: 'Allenamenti Palestra/Corsa', category: 'Salute e Benessere' },
  { key: 'weight_log', label: 'Storico Peso Corporeo', category: 'Salute e Benessere' },
  { key: 'gym_schedules', label: 'Schede di Allenamento', category: 'Salute e Benessere' },
  { key: 'sleep_log', label: 'Registro Sonno', category: 'Salute e Benessere' },
  { key: 'water_log', label: 'Registro Idratazione', category: 'Salute e Benessere' },
  
  { key: 'calendar_events', label: 'Eventi a Calendario', category: 'Calendario ed Assenze' },
  { key: 'absences', label: 'Ferie e Malattie', category: 'Calendario ed Assenze' },
  { key: 'recurring_events', label: 'Ricorrenze Annuali', category: 'Calendario ed Assenze' },
  
  { key: 'notes', label: 'Note Personali', category: 'Note' }
]

function ResetSection() {
  const { userConfig, setOnboardingCompleted } = useAppStore()
  const [showReset, setShowReset] = useState(false)
  const [resetType, setResetType] = useState(null) // 'onboarding' | 'all'
  const [loading, setLoading] = useState(false)
  const [selectedTables, setSelectedTables] = useState(exportOptions.map(o => o.key))

  const toggleTable = (key) => {
    if (selectedTables.includes(key)) {
      setSelectedTables(selectedTables.filter(k => k !== key))
    } else {
      setSelectedTables([...selectedTables, key])
    }
  }

  const handleExport = async () => {
    if (selectedTables.length === 0) {
      toast.error('Seleziona almeno un tipo di dato da esportare!')
      return
    }
    toast.info('Esportazione in corso...')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Utente non autenticato!')
        return
      }

      const dump = {}
      for (const t of selectedTables) {
        let query = supabase.from(t).select('*')
        
        if (t === 'finance_categories') {
          query = query.or(`user_id.eq.${user.id},user_id.is.null`)
        } else if (t === 'notifications_read') {
          // Questa tabella non ha user_id, selezioniamo tutti i record per retrocompatibilità
          query = query
        } else {
          query = query.eq('user_id', user.id)
        }

        const { data } = await query
        dump[t] = data || []
      }

      const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `vitaos-backup-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)

      toast.success('Backup scaricato con successo!')
    } catch (err) {
      toast.error("Errore durante l'esportazione dei dati")
      console.error(err)
    }
  }

  const handleResetOnboarding = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Utente non autenticato!')
        setLoading(false)
        return
      }

      if (userConfig?.id) {
        await supabase
          .from('user_config')
          .update({ onboarding_completed: false })
          .eq('id', userConfig.id)
          .eq('user_id', user.id)
      }
      setOnboardingCompleted(false)
      setShowReset(false)
      toast.success('Onboarding riattivato. Ricarica la pagina.')
    } catch (err) {
      toast.error("Errore durante il reset dell'onboarding")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleResetAll = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Utente non autenticato!')
        setLoading(false)
        return
      }

      const tables = [
        'saving_movements', 'saving_plans', 'transactions', 'work_sessions', 
        'absences', 'calendar_events', 'recurring_events', 'workout_sessions', 
        'weight_log', 'gym_schedules', 'notes', 'notifications_read', 
        'sleep_log', 'water_log', 'vehicles', 'vehicle_logs', 
        'tasks', 'mood_logs', 'subscriptions', 'finance_categories'
      ]
      for (const t of tables) {
        await supabase.from(t).delete().eq('user_id', user.id)
      }

      if (userConfig?.id) {
        await supabase
          .from('user_config')
          .update({
            first_name: '',
            last_name: '',
            theme: 'light',
            work_schedule: {
              "1": {"enabled": true,  "from": "08:30", "to": "17:30"},
              "2": {"enabled": true,  "from": "08:30", "to": "17:30"},
              "3": {"enabled": true,  "from": "08:30", "to": "17:30"},
              "4": {"enabled": true,  "from": "08:30", "to": "17:30"},
              "5": {"enabled": true,  "from": "08:30", "to": "17:30"},
              "6": {"enabled": false},
              "0": {"enabled": false}
            },
            daily_hours: 8.0,
            study_schedule: {},
            gym_schedule: {},
            annual_leave_days: 26,
            sick_days_used: 0,
            leave_days_used: 0,
            monthly_net_income: 0,
            has_thirteenth: true,
            has_fourteenth: false,
            thirteenth_month: 12,
            fourteenth_month: 6,
            savings_target_pct: 20,
            patron_saint_date: null,
            weight_kg: null,
            weight_updated_at: null,
            run_monthly_goal_km: 50,
            workout_weekly_goal: 4,
            total_run_km_ever: 0,
            gps_preset: 'balanced',
            gps_jitter_meters: 6,
            gps_keepalive: false,
            gps_keepalive_interval_ms: 2000,
            initial_bank_balance: 0,
            initial_cash_balance: 0,
            custom_accounts: null,
            onboarding_completed: false,
            onboarding_step: 0
          })
          .eq('id', userConfig.id)
          .eq('user_id', user.id)
      }

      // Rimuovi tutti i dati locali specifici di VitaOS dal localStorage
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('vitaos_') || key.startsWith('vitaos-')) {
          localStorage.removeItem(key)
        }
      })

      setOnboardingCompleted(false)
      setShowReset(false)
      toast.success('Tutti i dati sono stati resettati.')
      window.location.reload()
    } catch (err) {
      toast.error('Errore durante il reset dei dati')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-medium text-[var(--color-danger)]" style={{ fontFamily: 'var(--font-display)' }}>
          Zona pericolosa
        </h3>
        <p className="text-sm text-[var(--text-muted)] mt-0.5">
          Esportazione dati e reset dell'applicazione
        </p>
      </div>

      {/* Export */}
      <Card padding="lg" className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-[var(--border-subtle)] pb-3 gap-2">
          <div>
            <p className="text-sm font-black text-[var(--text-primary)]">Esporta dati</p>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">Seleziona quali moduli ed informazioni esportare nel backup JSON.</p>
          </div>
          <Button variant="outline" size="sm" icon={Download} onClick={handleExport} className="self-end md:self-auto">
            Scarica Backup ({selectedTables.length})
          </Button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setSelectedTables(exportOptions.map(o => o.key))}
            className="text-[10px] font-black uppercase text-[var(--color-primary)] hover:opacity-85"
          >
            Seleziona Tutto
          </button>
          <span className="text-[10px] text-[var(--text-muted)]">|</span>
          <button
            onClick={() => setSelectedTables([])}
            className="text-[10px] font-black uppercase text-[var(--text-muted)] hover:text-[var(--color-danger)]"
          >
            Deseleziona Tutto
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {Object.entries(
            exportOptions.reduce((acc, opt) => {
              if (!acc[opt.category]) acc[opt.category] = []
              acc[opt.category].push(opt)
              return acc
            }, {})
          ).map(([cat, opts]) => (
            <div key={cat} className="space-y-2 p-3 rounded-2xl bg-[var(--bg-base)] border border-[var(--border-subtle)]">
              <p className="text-[10px] font-black uppercase tracking-wider text-[var(--text-secondary)] mb-1">
                {cat}
              </p>
              <div className="space-y-1.5">
                {opts.map(opt => {
                  const isChecked = selectedTables.includes(opt.key)
                  return (
                    <label 
                      key={opt.key}
                      className="flex items-center gap-2 text-xs text-[var(--text-primary)] cursor-pointer select-none font-medium hover:opacity-80"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleTable(opt.key)}
                        className="rounded border-[var(--border-default)] text-[var(--color-primary)] focus:ring-[var(--color-primary-ghost)] w-4 h-4 cursor-pointer"
                      />
                      <span>{opt.label}</span>
                    </label>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Reset onboarding */}
      <Card padding="lg" className="border-[var(--color-warning)]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">Ripeti onboarding</p>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">Riesegui la configurazione iniziale</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={() => { setResetType('onboarding'); setShowReset(true) }}
          >
            Ripeti
          </Button>
        </div>
      </Card>

      {/* Full reset */}
      <Card padding="lg" className="border-[var(--color-danger)]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-[var(--color-danger)]">Cancella tutti i dati</p>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Elimina tutte le transazioni, sessioni, note e ricorrenze
            </p>
          </div>
          <Button
            variant="danger"
            size="sm"
            icon={Trash2}
            onClick={() => { setResetType('all'); setShowReset(true) }}
          >
            Cancella tutto
          </Button>
        </div>
      </Card>

      {/* Confirmation modal */}
      <Modal isOpen={showReset} onClose={() => setShowReset(false)} title="Conferma reset" footer={
        <>
          <Button variant="ghost" onClick={() => setShowReset(false)}>Annulla</Button>
          <Button
            variant="danger"
            loading={loading}
            onClick={resetType === 'all' ? handleResetAll : handleResetOnboarding}
          >
            {resetType === 'all' ? 'Cancella tutto' : 'Ripeti onboarding'}
          </Button>
        </>
      }>
        <div className="flex items-start gap-3 p-3 rounded-[var(--radius-md)] bg-[rgba(224,82,82,0.08)]">
          <AlertTriangle size={20} className="text-[var(--color-danger)] shrink-0 mt-0.5" />
          <div className="text-sm text-[var(--text-primary)]">
            {resetType === 'all' ? (
              <p>Questa azione cancellerà <strong>tutti i dati</strong> (transazioni, sessioni, note, ecc.). L'operazione è irreversibile. Ti consigliamo di esportare un backup prima.</p>
            ) : (
              <p>Verrai riportato alla schermata di configurazione iniziale. I tuoi dati rimarranno intatti.</p>
            )}
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default ResetSection
