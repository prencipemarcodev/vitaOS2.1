import { useCallback } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { supabase } from '@/lib/supabase'
import Card from '@/components/ui/Card'
import TimeBlockSelector from '@/components/ui/TimeBlockSelector'

function WorkSection() {
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
          Orari lavorativi e attività
        </h3>
        <p className="text-sm text-[var(--text-muted)] mt-0.5">
          Configura i tuoi orari settimanali per lavoro, studio e palestra
        </p>
      </div>

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
