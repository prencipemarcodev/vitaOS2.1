import { useState } from 'react'
import { AlertTriangle, Trash2, RefreshCw, Download } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { supabase } from '@/lib/supabase'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import { toast } from 'sonner'

function ResetSection() {
  const { userConfig, setOnboardingCompleted } = useAppStore()
  const [showReset, setShowReset] = useState(false)
  const [resetType, setResetType] = useState(null) // 'onboarding' | 'all'
  const [loading, setLoading] = useState(false)

  const handleExport = async () => {
    toast.info('Esportazione in corso...')

    const tables = [
      'user_config', 'calendar_events', 'absences', 'recurring_events',
      'work_sessions', 'transactions', 'finance_categories',
      'saving_plans', 'saving_movements', 'workout_sessions',
      'weight_log', 'gym_schedules', 'notes'
    ]

    const dump = {}
    for (const t of tables) {
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

    toast.success('Backup scaricato!')
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
      'notes', 'notifications_read'
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
      <Card padding="lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">Esporta dati</p>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">Scarica un backup JSON completo</p>
          </div>
          <Button variant="outline" size="sm" icon={Download} onClick={handleExport}>
            Scarica
          </Button>
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
