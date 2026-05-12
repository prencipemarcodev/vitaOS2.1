import { motion } from 'framer-motion'
import { Clock } from 'lucide-react'
import Card from '@/components/ui/Card'
import TimeBlockSelector from '@/components/ui/TimeBlockSelector'

function StepOrariLavoro({ formData, updateFormData }) {
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
          <Clock size={28} className="text-[var(--color-primary)]" />
        </motion.div>
        <h2
          className="text-2xl font-medium text-[var(--text-primary)]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Orario lavorativo
        </h2>
        <p className="text-sm text-[var(--text-secondary)] max-w-sm mx-auto">
          Configura i tuoi giorni e orari lavorativi. Serviranno per calcolare il monte ore e le notifiche.
        </p>
      </div>

      {/* TimeBlockSelector */}
      <Card padding="lg">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--color-primary)]" />
            <p className="text-sm font-medium text-[var(--text-primary)]">
              Orario lavorativo settimanale
            </p>
          </div>
          <TimeBlockSelector
            mode="work"
            value={formData.work_schedule}
            onChange={(schedule) => updateFormData({ work_schedule: schedule })}
          />
        </div>
      </Card>

      {/* Info */}
      <div className="flex items-start gap-3 p-3 rounded-[var(--radius-md)] bg-[var(--bg-elevated)]">
        <span className="text-lg">💡</span>
        <div className="text-xs text-[var(--text-secondary)] space-y-1">
          <p>Clicca su un giorno per attivarlo/disattivarlo.</p>
          <p>Puoi avere orari diversi per ogni giorno.</p>
          <p>Potrai sempre modificarli dopo dalle Impostazioni.</p>
        </div>
      </div>
    </div>
  )
}

export default StepOrariLavoro
