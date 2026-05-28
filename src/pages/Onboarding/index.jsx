import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Check, SkipForward } from 'lucide-react'
import clsx from 'clsx'
import { supabase } from '@/lib/supabase'
import { useAppStore } from '@/store/useAppStore'
import { useSupabaseSync } from '@/hooks/useSupabaseSync'
import Button from '@/components/ui/Button'
import Logo from '@/components/layout/Logo'
import StepIdentita from './StepIdentita'
import StepReddito from './StepReddito'
import StepOrariLavoro from './StepOrariLavoro'
import StepOrariStudioGym from './StepOrariStudioGym'
import StepCalendario from './StepCalendario'
import StepSaldoIniziale from './StepSaldoIniziale'
import StepPrimoRisparmio from './StepPrimoRisparmio'
import StepVeicolo from './StepVeicolo'
import StepNotifiche from './StepNotifiche'
import StepDone from './StepDone'

const STEPS = [
  { id: 'identita',    label: 'Identità',         component: StepIdentita },
  { id: 'reddito',     label: 'Reddito',          component: StepReddito },
  { id: 'lavoro',      label: 'Orari lavoro',     component: StepOrariLavoro },
  { id: 'studio_gym',  label: 'Studio & Palestra', component: StepOrariStudioGym },
  { id: 'calendario',  label: 'Calendario & Ferie', component: StepCalendario },
  { id: 'saldo',       label: 'Saldo iniziale',   component: StepSaldoIniziale },
  { id: 'risparmio',   label: 'Primo risparmio',  component: StepPrimoRisparmio },
  { id: 'veicolo',     label: 'Il tuo Garage',    component: StepVeicolo },
  { id: 'notifiche',   label: 'Promemoria',       component: StepNotifiche },
  { id: 'done',        label: 'Pronti!',          component: StepDone },
]

function Onboarding() {
  const { setOnboardingCompleted, userConfig, setShowOnboardingForce } = useAppStore()
  const { reload } = useSupabaseSync()
  const [currentStep, setCurrentStep] = useState(userConfig?.onboarding_step || 0)
  const [direction, setDirection] = useState(1)
  const [formData, setFormData] = useState({
    // Step 0 — Identità
    first_name: userConfig?.first_name || '',
    last_name: userConfig?.last_name || '',

    // Step 1 — Reddito
    monthly_net_income: userConfig?.monthly_net_income || '',
    has_thirteenth: userConfig?.has_thirteenth ?? true,
    has_fourteenth: userConfig?.has_fourteenth ?? false,
    thirteenth_month: userConfig?.thirteenth_month || 12,
    fourteenth_month: userConfig?.fourteenth_month || 6,
    savings_target_pct: userConfig?.savings_target_pct || 20,

    // Step 2 — Orari lavoro
    work_schedule: userConfig?.work_schedule || {
      '1': { enabled: true, from: '08:30', to: '17:30' },
      '2': { enabled: true, from: '08:30', to: '17:30' },
      '3': { enabled: true, from: '08:30', to: '17:30' },
      '4': { enabled: true, from: '08:30', to: '17:30' },
      '5': { enabled: true, from: '08:30', to: '17:30' },
      '6': { enabled: false },
      '0': { enabled: false },
    },

    // Step 3 — Studio & Palestra
    study_schedule: userConfig?.study_schedule || {},
    gym_schedule: userConfig?.gym_schedule || {},

    // Step 4 — Calendario & Ferie
    patron_saint_date: userConfig?.patron_saint_date || '',
    annual_leave_days: userConfig?.annual_leave_days ?? 26,
    recurring_events: [],

    // Step 5 — Saldo
    initial_bank_balance: userConfig?.initial_bank_balance || '',
    initial_cash_balance: userConfig?.initial_cash_balance || '',

    // Step 6 — Primo risparmio (opzionale)
    first_plan: null,

    // Step 7 — Veicolo (opzionale)
    has_vehicle: null,      // null | true | false
    vehicle_type: null,     // city | hatchback | sedan | wagon | suv | suv_large | electric
    vehicle_color: '#9aacc8',
  })

  const configId = userConfig?.id
  
  // Il tasto Salta è attivo solo se l'identità è stata inserita
  const canSkip = formData.first_name.trim().length > 0 && formData.last_name.trim().length > 0

  const updateFormData = useCallback((updates) => {
    setFormData((prev) => ({ ...prev, ...updates }))
  }, [])

  // ── Salva dati dello step corrente su Supabase ──
  const saveStepData = useCallback(async (stepId) => {
    if (!configId) return

    let data = null

    if (stepId === 'identita') {
      data = {
        first_name: formData.first_name,
        last_name: formData.last_name,
      }
    } else if (stepId === 'reddito') {
      data = {
        monthly_net_income: parseFloat(formData.monthly_net_income) || 0,
        has_thirteenth: formData.has_thirteenth,
        has_fourteenth: formData.has_fourteenth,
        thirteenth_month: formData.thirteenth_month,
        fourteenth_month: formData.fourteenth_month,
        savings_target_pct: formData.savings_target_pct,
      }
    } else if (stepId === 'lavoro') {
      data = {
        work_schedule: formData.work_schedule,
        daily_hours: calculateDailyHours(formData.work_schedule),
      }
    } else if (stepId === 'studio_gym') {
      data = {
        study_schedule: formData.study_schedule,
        gym_schedule: formData.gym_schedule,
      }
    } else if (stepId === 'calendario') {
      data = {
        patron_saint_date: formData.patron_saint_date || null,
        annual_leave_days: formData.annual_leave_days ?? 26,
      }
      
      // Salva le ricorrenze annuali se presenti
      if (formData.recurring_events && formData.recurring_events.length > 0) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          // Cancella eventi ricorrenti esistenti per prevenire duplicati
          await supabase.from('recurring_events').delete().eq('user_id', user.id)
          
          // Inserisci i nuovi eventi
          const payload = formData.recurring_events.map(ev => ({
            ...ev,
            user_id: user.id
          }))
          await supabase.from('recurring_events').insert(payload)
        }
      }
    } else if (stepId === 'saldo') {
      data = {
        initial_bank_balance: parseFloat(formData.initial_bank_balance) || 0,
        initial_cash_balance: parseFloat(formData.initial_cash_balance) || 0,
      }
    } else if (stepId === 'risparmio' && formData.first_plan) {
      const plan = formData.first_plan
      if (plan.name && plan.target_amount) {
        const { data: { user } } = await supabase.auth.getUser()
        await supabase.from('saving_plans').insert({
          user_id: user?.id,
          name: plan.name,
          target_amount: parseFloat(plan.target_amount) || 0,
          target_date: plan.target_date || null,
          monthly_contribution: parseFloat(plan.monthly_contribution) || null,
          type: 'goal',
          is_active: true,
        })
      }
    } else if (stepId === 'veicolo' && formData.has_vehicle === true && formData.vehicle_type) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Controlla se esiste già un veicolo creato in questo onboarding
        const { data: existing } = await supabase
          .from('vehicles')
          .select('id')
          .eq('user_id', user.id)
          .eq('name', 'La mia Auto')
          .limit(1)
        
        if (!existing || existing.length === 0) {
          await supabase.from('vehicles').insert({
            user_id: user.id,
            name: 'La mia Auto',
            vehicle_type: formData.vehicle_type,
            color: formData.vehicle_color ?? '#9aacc8',
          })
        }
      }
    }

    const currentStepIndex = STEPS.findIndex(s => s.id === stepId)
    const updatePayload = { 
      ...data, 
      onboarding_step: currentStepIndex + 1 
    }

    if (configId) {
      await supabase.from('user_config').update(updatePayload).eq('id', configId)
    }
  }, [configId, formData])

  // ── Navigazione step ──
  const goNext = async () => {
    await saveStepData(STEPS[currentStep].id)
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
    if (!canSkip) return
    if (configId) {
      // Salva almeno il nome prima di saltare
      await supabase.from('user_config').update({ 
        first_name: formData.first_name,
        last_name: formData.last_name,
        onboarding_completed: true 
      }).eq('id', configId)
    }
    setShowOnboardingForce(false)
    setOnboardingCompleted(true)
    // Ricarica tutti i dati dopo il completamento dell'onboarding
    setTimeout(() => reload.all(), 300)
  }

  const handleFinish = async () => {
    await saveStepData(STEPS[currentStep].id)
    if (configId) {
      await supabase.from('user_config').update({ onboarding_completed: true, onboarding_step: STEPS.length - 1 }).eq('id', configId)
    }
    setShowOnboardingForce(false)
    setOnboardingCompleted(true)
    // Ricarica tutti i dati dopo il completamento dell'onboarding
    setTimeout(() => reload.all(), 300)
  }

  const StepComponent = STEPS[currentStep].component
  const isLast = currentStep === STEPS.length - 1
  const stepId = STEPS[currentStep].id
  const isWideStep = ['lavoro', 'studio_gym', 'calendario'].includes(stepId)

  const slideVariants = {
    enter: (dir) => ({ x: dir > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir) => ({ x: dir > 0 ? -80 : 80, opacity: 0 }),
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[var(--bg-base)]">
      {/* ── Header ── */}
      <header className="flex items-center justify-between px-6 py-4 pt-[calc(env(safe-area-inset-top,20px)+12px)] shrink-0">
        <div className="flex flex-col">
          <Logo className="text-lg leading-tight" name={formData.first_name} />
          <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-tight">
            Configurazione
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          icon={SkipForward}
          onClick={handleSkip}
          disabled={!canSkip}
          className="text-[var(--text-muted)] h-8 !text-xs font-bold"
        >
          Salta
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
            <div className={clsx("mx-auto transition-all duration-300", isWideStep ? "max-w-3xl" : "max-w-xl")}>
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
