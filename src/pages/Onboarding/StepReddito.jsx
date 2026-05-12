import { motion } from 'framer-motion'
import { Wallet, Gift, Sun } from 'lucide-react'
import Input from '@/components/ui/Input'
import Toggle from '@/components/ui/Toggle'
import Card from '@/components/ui/Card'

const MONTHS = [
  { value: 1, label: 'Gennaio' },
  { value: 2, label: 'Febbraio' },
  { value: 3, label: 'Marzo' },
  { value: 4, label: 'Aprile' },
  { value: 5, label: 'Maggio' },
  { value: 6, label: 'Giugno' },
  { value: 7, label: 'Luglio' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Settembre' },
  { value: 10, label: 'Ottobre' },
  { value: 11, label: 'Novembre' },
  { value: 12, label: 'Dicembre' },
]

function StepReddito({ formData, updateFormData }) {
  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="text-center space-y-2">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
          className="w-16 h-16 mx-auto rounded-2xl bg-[var(--color-primary-ghost)] flex items-center justify-center"
        >
          <Wallet size={28} className="text-[var(--color-primary)]" />
        </motion.div>
        <h2
          className="text-2xl font-medium text-[var(--text-primary)]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Benvenuto in VitaOS
        </h2>
        <p className="text-sm text-[var(--text-secondary)] max-w-sm mx-auto">
          Iniziamo configurando il tuo reddito. Questi dati ci aiuteranno a gestire le finanze e i risparmi.
        </p>
      </div>

      {/* Stipendio */}
      <Card padding="lg">
        <Input
          label="Stipendio netto mensile"
          type="number"
          prefix="€"
          placeholder="2000"
          value={formData.monthly_net_income}
          onChange={(e) => updateFormData({ monthly_net_income: e.target.value })}
          helper="Il tuo stipendio netto mensile, al netto delle tasse"
        />
      </Card>

      {/* Mensilità aggiuntive */}
      <Card padding="lg" className="space-y-4">
        <p className="text-sm font-medium text-[var(--text-primary)]">Mensilità aggiuntive</p>

        {/* 13a */}
        <div className="flex items-center justify-between p-3 rounded-[var(--radius-md)] bg-[var(--bg-elevated)]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[rgba(61,153,112,0.12)] flex items-center justify-center">
              <Gift size={16} className="text-[var(--color-success)]" />
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">13ª Mensilità</p>
              <p className="text-xs text-[var(--text-muted)]">Tredicesima</p>
            </div>
          </div>
          <Toggle
            checked={formData.has_thirteenth}
            onChange={(v) => updateFormData({ has_thirteenth: v })}
          />
        </div>

        {formData.has_thirteenth && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="pl-11"
          >
            <label className="text-xs text-[var(--text-muted)] mb-1 block">Mese di erogazione</label>
            <select
              value={formData.thirteenth_month}
              onChange={(e) => updateFormData({ thirteenth_month: parseInt(e.target.value) })}
              className="w-full h-9 rounded-[var(--radius-md)] border border-[var(--border-default)]
                bg-[var(--bg-surface)] text-[var(--text-primary)] text-sm px-3
                focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            >
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </motion.div>
        )}

        {/* 14a */}
        <div className="flex items-center justify-between p-3 rounded-[var(--radius-md)] bg-[var(--bg-elevated)]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[rgba(212,160,23,0.12)] flex items-center justify-center">
              <Sun size={16} className="text-[var(--color-warning)]" />
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">14ª Mensilità</p>
              <p className="text-xs text-[var(--text-muted)]">Quattordicesima</p>
            </div>
          </div>
          <Toggle
            checked={formData.has_fourteenth}
            onChange={(v) => updateFormData({ has_fourteenth: v })}
          />
        </div>

        {formData.has_fourteenth && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="pl-11"
          >
            <label className="text-xs text-[var(--text-muted)] mb-1 block">Mese di erogazione</label>
            <select
              value={formData.fourteenth_month}
              onChange={(e) => updateFormData({ fourteenth_month: parseInt(e.target.value) })}
              className="w-full h-9 rounded-[var(--radius-md)] border border-[var(--border-default)]
                bg-[var(--bg-surface)] text-[var(--text-primary)] text-sm px-3
                focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            >
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </motion.div>
        )}
      </Card>

      {/* Percentuale risparmio */}
      <Card padding="lg" className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-[var(--text-primary)]">Obiettivo risparmio mensile</p>
          <span className="text-lg font-semibold text-[var(--color-primary)] font-num">
            {formData.savings_target_pct}%
          </span>
        </div>
        <input
          type="range"
          min={5}
          max={50}
          step={1}
          value={formData.savings_target_pct}
          onChange={(e) => updateFormData({ savings_target_pct: parseInt(e.target.value) })}
          className="w-full accent-[var(--color-primary)]"
        />
        <div className="flex justify-between text-xs text-[var(--text-muted)]">
          <span>5%</span>
          <span>50%</span>
        </div>
        {formData.monthly_net_income && (
          <p className="text-xs text-[var(--text-secondary)] text-center">
            ≈ €{((parseFloat(formData.monthly_net_income) || 0) * formData.savings_target_pct / 100).toFixed(0)} al mese
          </p>
        )}
      </Card>
    </div>
  )
}

export default StepReddito
