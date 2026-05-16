import { useCallback } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { supabase } from '@/lib/supabase'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Toggle from '@/components/ui/Toggle'

const MONTHS = [
  { value: 1, label: 'Gennaio' }, { value: 2, label: 'Febbraio' },
  { value: 3, label: 'Marzo' },   { value: 4, label: 'Aprile' },
  { value: 5, label: 'Maggio' },   { value: 6, label: 'Giugno' },
  { value: 7, label: 'Luglio' },   { value: 8, label: 'Agosto' },
  { value: 9, label: 'Settembre' },{ value: 10, label: 'Ottobre' },
  { value: 11, label: 'Novembre' },{ value: 12, label: 'Dicembre' },
]

function IncomeSection() {
  const { userConfig, setUserConfig } = useAppStore()

  const save = useCallback(async (field, value) => {
    if (!userConfig?.id) return
    setUserConfig({ ...userConfig, [field]: value })
    await supabase.from('user_config').update({ [field]: value }).eq('id', userConfig.id)
  }, [userConfig, setUserConfig])

  const income = parseFloat(userConfig?.monthly_net_income) || 0
  const savePct = userConfig?.savings_target_pct || 20

  return (
    <div className="space-y-6">

      {/* Stipendio */}
      <Card padding="lg">
        <Input
          label="Stipendio netto mensile"
          type="number"
          prefix="€"
          value={userConfig?.monthly_net_income || ''}
          onChange={(e) => save('monthly_net_income', parseFloat(e.target.value) || 0)}
        />
      </Card>

      {/* 13a e 14a */}
      <Card padding="lg" className="space-y-4">
        <p className="text-sm font-medium text-[var(--text-primary)]">Mensilità aggiuntive</p>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-[var(--text-primary)]">13ª Mensilità</p>
            {userConfig?.has_thirteenth && (
              <select
                value={userConfig?.thirteenth_month || 12}
                onChange={(e) => save('thirteenth_month', parseInt(e.target.value))}
                className="mt-1 text-xs border border-[var(--border-default)] rounded px-2 py-1 bg-[var(--bg-surface)] text-[var(--text-primary)]"
              >
                {MONTHS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            )}
          </div>
          <Toggle
            checked={!!userConfig?.has_thirteenth}
            onChange={(v) => save('has_thirteenth', v)}
          />
        </div>

        <div className="border-t border-[var(--border-subtle)] pt-3 flex items-center justify-between">
          <div>
            <p className="text-sm text-[var(--text-primary)]">14ª Mensilità</p>
            {userConfig?.has_fourteenth && (
              <select
                value={userConfig?.fourteenth_month || 6}
                onChange={(e) => save('fourteenth_month', parseInt(e.target.value))}
                className="mt-1 text-xs border border-[var(--border-default)] rounded px-2 py-1 bg-[var(--bg-surface)] text-[var(--text-primary)]"
              >
                {MONTHS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            )}
          </div>
          <Toggle
            checked={!!userConfig?.has_fourteenth}
            onChange={(v) => save('has_fourteenth', v)}
          />
        </div>
      </Card>

      {/* % Risparmio */}
      <Card padding="lg" className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-[var(--text-primary)]">Obiettivo risparmio</p>
          <span className="text-lg font-semibold text-[var(--color-primary)] font-num">{savePct}%</span>
        </div>
        <input
          type="range" min={5} max={50} step={1}
          value={savePct}
          onChange={(e) => save('savings_target_pct', parseInt(e.target.value))}
          className="w-full accent-[var(--color-primary)]"
        />
        <div className="flex justify-between text-xs text-[var(--text-muted)]">
          <span>5%</span>
          <span>50%</span>
        </div>
        {income > 0 && (
          <p className="text-xs text-[var(--text-secondary)] text-center">
            ≈ €{(income * savePct / 100).toFixed(0)}/mese
          </p>
        )}
      </Card>
    </div>
  )
}

export default IncomeSection
