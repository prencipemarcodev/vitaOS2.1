import { useCallback } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { supabase } from '@/lib/supabase'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'

function HealthSection() {
  const { userConfig, setUserConfig } = useAppStore()

  const save = useCallback(async (field, value) => {
    if (!userConfig?.id) return
    setUserConfig({ ...userConfig, [field]: value })
    await supabase.from('user_config').update({ [field]: value }).eq('id', userConfig.id)
  }, [userConfig, setUserConfig])

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-medium text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
          Salute
        </h3>
        <p className="text-sm text-[var(--text-muted)] mt-0.5">
          Obiettivi di allenamento e corsa
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
            value={userConfig?.run_monthly_goal_km || ''}
            onChange={(e) => save('run_monthly_goal_km', parseFloat(e.target.value) || 0)}
            helper="Obiettivo mensile"
          />
        </div>
      </Card>

      {/* Storico totale */}
      <Card padding="lg" className="space-y-3">
        <p className="text-sm font-medium text-[var(--text-primary)]">Storico</p>
        <Input
          label="Km totali corsa (carriera)"
          type="number"
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
          suffix="kg"
          value={userConfig?.weight_kg || ''}
          onChange={(e) => {
            const v = parseFloat(e.target.value) || null
            save('weight_kg', v)
            save('weight_updated_at', new Date().toISOString().split('T')[0])
          }}
        />
      </Card>
    </div>
  )
}

export default HealthSection
