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
      const dump = {}
      for (const t of selectedTables) {
        const { data } = await supabase.from(t).select('*')
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
    if (userConfig?.id) {
      await supabase.from('user_config').update({ onboarding_completed: false }).eq('id', userConfig.id)
    }
    setOnboardingCompleted(false)
    setLoading(false)
    setShowReset(false)
    toast.success('Onboarding riattivato. Ricarica la pagina.')
  }

  const handleResetAll = async () => {
    setLoading(true)
    const tables = [
      'saving_movements', 'saving_plans',
      'transactions', 'work_sessions', 'absences', 'calendar_events',
      'recurring_events', 'workout_sessions', 'weight_log', 'gym_schedules',
      'notes', 'notifications_read', 'sleep_log', 'water_log'
    ]
    for (const t of tables) {
      await supabase.from(t).delete().neq('id', '00000000-0000-0000-0000-000000000000')
    }
    if (userConfig?.id) {
      await supabase.from('user_config').update({ onboarding_completed: false }).eq('id', userConfig.id)
    }
    setOnboardingCompleted(false)
    setLoading(false)
    setShowReset(false)
    toast.success('Tutti i dati sono stati resettati.')
    window.location.reload()
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
