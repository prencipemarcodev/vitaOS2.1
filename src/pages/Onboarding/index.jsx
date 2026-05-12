import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Check, SkipForward } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAppStore } from '@/store/useAppStore'
import Button from '@/components/ui/Button'
import StepReddito from './StepReddito'
import StepOrariLavoro from './StepOrariLavoro'
import StepOrariStudioGym from './StepOrariStudioGym'
import StepSaldoIniziale from './StepSaldoIniziale'
import StepPrimoRisparmio from './StepPrimoRisparmio'
import StepDone from './StepDone'

const STEPS = [
  { id: 'reddito',     label: 'Reddito',          component: StepReddito },
  { id: 'lavoro',      label: 'Orari lavoro',     component: StepOrariLavoro },
  { id: 'studio_gym',  label: 'Studio & Palestra', component: StepOrariStudioGym },
  { id: 'saldo',       label: 'Saldo iniziale',   component: StepSaldoIniziale },
  { id: 'risparmio',   label: 'Primo risparmio',  component: StepPrimoRisparmio },
  { id: 'done',        label: 'Pronti!',          component: StepDone },
]

function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0)
  const [direction, setDirection] = useState(1)
  const [formData, setFormData] = useState({
    // Step 1 — Reddito
    monthly_net_income: '',
    has_thirteenth: true,
    has_fourteenth: false,
    thirteenth_month: 12,
    fourteenth_month: 6,
    savings_target_pct: 20,

    // Step 2 — Orari lavoro
    work_schedule: {
      '1': { enabled: true, from: '08:30', to: '17:30' },
      '2': { enabled: true, from: '08:30', to: '17:30' },
      '3': { enabled: true, from: '08:30', to: '17:30' },
      '4': { enabled: true, from: '08:30', to: '17:30' },
      '5': { enabled: true, from: '08:30', to: '17:30' },
      '6': { enabled: false },
      '0': { enabled: false },
    },

    // Step 3 — Studio & Palestra
    study_schedule: {},
    gym_schedule: {},

    // Step 4 — Saldo
    initial_bank_balance: '',
    initial_cash_balance: '',

    // Step 5 — Primo risparmio (opzionale)
    first_plan: null,
  })

  const { setOnboardingCompleted, userConfig } = useAppStore()
  const configId = userConfig?.id

  const updateFormData = useCallback((updates) => {
    setFormData((prev) => ({ ...prev, ...updates }))
  }, [])

  // ── Salva dati dello step corrente su Supabase ──
  const saveStepData = useCallback(async (stepIndex) => {
    if (!configId) return

    const stepSaveMap = {
      0: {
        monthly_net_income: parseFloat(formData.monthly_net_income) || 0,
        has_thirteenth: formData.has_thirteenth,
        has_fourteenth: formData.has_fourteenth,
        thirteenth_month: formData.thirteenth_month,
        fourteenth_month: formData.fourteenth_month,
        savings_target_pct: formData.savings_target_pct,
      },
      1: {
        work_schedule: formData.work_schedule,
        daily_hours: calculateDailyHours(formData.work_schedule),
      },
      2: {
        study_schedule: formData.study_schedule,
        gym_schedule: formData.gym_schedule,
      },
      3: {
        initial_bank_balance: parseFloat(formData.initial_bank_balance) || 0,
        initial_cash_balance: parseFloat(formData.initial_cash_balance) || 0,
      },
    }

    const data = stepSaveMap[stepIndex]
    if (data) {
      await supabase.from('user_config').update(data).eq('id', configId)
    }

    // Step 5 — crea piano risparmio se compilato
    if (stepIndex === 4 && formData.first_plan) {
      const plan = formData.first_plan
      if (plan.name && plan.target_amount) {
        await supabase.from('saving_plans').insert({
          name: plan.name,
          target_amount: parseFloat(plan.target_amount) || 0,
          target_date: plan.target_date || null,
          monthly_contribution: parseFloat(plan.monthly_contribution) || null,
          type: 'goal',
          is_active: true,
        })
      }
    }
  }, [configId, formData])

  // ── Navigazione step ──
  const goNext = async () => {
    await saveStepData(currentStep)
    if (currentStep < STEPS.length - 1) {
      setDirection(1)
      setCurrentStep((s) => s + 1)
    }
  }

  const goPrev = () => {
    if (currentStep > 0) {
      setDirection(-1)
      setCurrentStep((s) => s - 1)
    }
  }

  const handleSkip = async () => {
    if (configId) {
      await supabase.from('user_config').update({ onboarding_completed: true }).eq('id', configId)
    }
    setOnboardingCompleted(true)
  }

  const handleFinish = async () => {
    await saveStepData(currentStep)
    if (configId) {
      await supabase.from('user_config').update({ onboarding_completed: true }).eq('id', configId)
    }
    setOnboardingCompleted(true)
  }

  const StepComponent = STEPS[currentStep].component
  const isLast = currentStep === STEPS.length - 1

  const slideVariants = {
    enter: (dir) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[var(--bg-base)]">
      {/* ── Header ── */}
      <header className="flex items-center justify-between px-6 py-4 shrink-0">
        <div className="flex items-center gap-2">
          <span
            className="text-xl font-semibold text-[var(--text-primary)]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            vita<span style={{ color: 'var(--color-primary)' }}>OS</span>
          </span>
          <span className="text-xs text-[var(--text-muted)] mt-1">Configurazione iniziale</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          icon={SkipForward}
          onClick={handleSkip}
          className="text-[var(--text-muted)]"
        >
          Salta per ora
        </Button>
      </header>

      {/* ── Stepper ── */}
      <div className="flex items-center justify-center gap-1 px-6 py-3 shrink-0">
        {STEPS.map((step, i) => (
          <div key={step.id} className="flex items-center gap-1">
            <motion.div
              className="flex items-center justify-center rounded-full transition-all duration-300"
              animate={{
                width: i === currentStep ? 28 : 10,
                height: 10,
                backgroundColor: i <= currentStep ? 'var(--color-primary)' : 'var(--bg-hover)',
              }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            >
              {i < currentStep && (
                <Check size={8} className="text-white" strokeWidth={3} />
              )}
            </motion.div>
          </div>
        ))}
      </div>
      <p className="text-center text-xs text-[var(--text-muted)] pb-2">
        Passo {currentStep + 1} di {STEPS.length} — {STEPS[currentStep].label}
      </p>

      {/* ── Step Content ── */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="absolute inset-0 overflow-y-auto px-6 py-4"
          >
            <div className="max-w-xl mx-auto">
              <StepComponent
                formData={formData}
                updateFormData={updateFormData}
                onFinish={handleFinish}
              />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Footer Navigation ── */}
      <footer className="flex items-center justify-between px-6 py-4 border-t border-[var(--border-subtle)] shrink-0 safe-bottom">
        <Button
          variant="ghost"
          size="md"
          icon={ChevronLeft}
          onClick={goPrev}
          disabled={currentStep === 0}
        >
          Indietro
        </Button>

        {isLast ? (
          <Button
            variant="primary"
            size="md"
            iconRight={Check}
            onClick={handleFinish}
          >
            Inizia ad usare VitaOS
          </Button>
        ) : (
          <Button
            variant="primary"
            size="md"
            iconRight={ChevronRight}
            onClick={goNext}
          >
            Avanti
          </Button>
        )}
      </footer>
    </div>
  )
}

function calculateDailyHours(schedule) {
  const enabledDays = Object.values(schedule).filter((d) => d?.enabled && d.from && d.to)
  if (enabledDays.length === 0) return 8

  const totalMinutes = enabledDays.reduce((sum, d) => {
    const [fh, fm] = d.from.split(':').map(Number)
    const [th, tm] = d.to.split(':').map(Number)
    return sum + Math.max((th * 60 + tm) - (fh * 60 + fm), 0)
  }, 0)

  return parseFloat((totalMinutes / enabledDays.length / 60).toFixed(2))
}

export default Onboarding
