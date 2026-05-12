import { useState } from 'react'
import { motion } from 'framer-motion'
import { PiggyBank, Target, Calendar } from 'lucide-react'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'
import Toggle from '@/components/ui/Toggle'

function StepPrimoRisparmio({ formData, updateFormData }) {
  const [wantsPlan, setWantsPlan] = useState(!!formData.first_plan)

  const plan = formData.first_plan || { name: '', target_amount: '', target_date: '', monthly_contribution: '' }

  const updatePlan = (updates) => {
    updateFormData({ first_plan: { ...plan, ...updates } })
  }

  const handleToggle = (v) => {
    setWantsPlan(v)
    if (!v) updateFormData({ first_plan: null })
    else updateFormData({ first_plan: plan })
  }

  // Preview: stima mesi necessari
  const targetAmount = parseFloat(plan.target_amount) || 0
  const monthlyContrib = parseFloat(plan.monthly_contribution) || 0
  const estimatedMonths = monthlyContrib > 0 ? Math.ceil(targetAmount / monthlyContrib) : null

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="text-center space-y-2">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
          className="w-16 h-16 mx-auto rounded-2xl bg-[rgba(180,98,67,0.12)] flex items-center justify-center"
        >
          <PiggyBank size={28} className="text-[var(--color-primary)]" />
        </motion.div>
        <h2
          className="text-2xl font-medium text-[var(--text-primary)]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Il tuo primo obiettivo
        </h2>
        <p className="text-sm text-[var(--text-secondary)] max-w-sm mx-auto">
          Vuoi creare subito un piano di risparmio? Ad esempio per un acquisto, un viaggio o un fondo emergenza.
          È completamente opzionale.
        </p>
      </div>

      {/* Toggle */}
      <Card padding="lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Target size={18} className="text-[var(--color-primary)]" />
            <p className="text-sm font-medium text-[var(--text-primary)]">
              Crea un piano di risparmio
            </p>
          </div>
          <Toggle checked={wantsPlan} onChange={handleToggle} />
        </div>
      </Card>

      {/* Plan form */}
      {wantsPlan && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="space-y-4"
        >
          <Card padding="lg" className="space-y-4">
            <Input
              label="Nome del piano"
              placeholder="es. MacBook Pro, Vacanze, Fondo emergenza"
              value={plan.name}
              onChange={(e) => updatePlan({ name: e.target.value })}
            />

            <Input
              label="Importo obiettivo"
              type="number"
              prefix="€"
              placeholder="2000"
              value={plan.target_amount}
              onChange={(e) => updatePlan({ target_amount: e.target.value })}
            />

            <Input
              label="Contributo mensile desiderato"
              type="number"
              prefix="€"
              placeholder="200"
              value={plan.monthly_contribution}
              onChange={(e) => updatePlan({ monthly_contribution: e.target.value })}
              helper="Quanto vuoi mettere da parte ogni mese"
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[var(--text-secondary)] flex items-center gap-1.5">
                <Calendar size={14} />
                Data obiettivo (opzionale)
              </label>
              <input
                type="date"
                value={plan.target_date}
                onChange={(e) => updatePlan({ target_date: e.target.value })}
                className="w-full h-9 rounded-[var(--radius-md)] border border-[var(--border-default)]
                  bg-[var(--bg-surface)] text-[var(--text-primary)] text-sm px-3
                  focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
            </div>
          </Card>

          {/* Preview stima */}
          {estimatedMonths && targetAmount > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center p-4 rounded-[var(--radius-lg)] bg-[var(--bg-elevated)]"
            >
              <p className="text-xs text-[var(--text-muted)] mb-1">Stima raggiungimento</p>
              <p className="text-xl font-semibold text-[var(--color-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
                ~{estimatedMonths} {estimatedMonths === 1 ? 'mese' : 'mesi'}
              </p>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                €{monthlyContrib.toFixed(0)}/mese × {estimatedMonths} mesi = €{(monthlyContrib * estimatedMonths).toFixed(0)}
              </p>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Examples */}
      {!wantsPlan && (
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: '💻', label: 'Gadget' },
            { icon: '✈️', label: 'Viaggio' },
            { icon: '🛡️', label: 'Emergenza' },
          ].map((ex) => (
            <button
              key={ex.label}
              onClick={() => {
                handleToggle(true)
                updatePlan({ name: ex.label })
              }}
              className="flex flex-col items-center gap-1.5 p-3 rounded-[var(--radius-md)]
                bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)]
                text-[var(--text-secondary)] hover:text-[var(--text-primary)]
                transition-colors border border-transparent hover:border-[var(--border-default)]"
            >
              <span className="text-xl">{ex.icon}</span>
              <span className="text-xs font-medium">{ex.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default StepPrimoRisparmio
