import { useState } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Dumbbell, ChevronDown, ChevronUp } from 'lucide-react'
import Card from '@/components/ui/Card'
import TimeBlockSelector from '@/components/ui/TimeBlockSelector'

function StepOrariStudioGym({ formData, updateFormData }) {
  const [studyOpen, setStudyOpen] = useState(false)
  const [gymOpen, setGymOpen] = useState(false)

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="text-center space-y-2">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
          className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, rgba(155,89,182,0.12), rgba(61,153,112,0.12))' }}
        >
          <BookOpen size={28} className="text-[#9b59b6]" />
        </motion.div>
        <h2
          className="text-2xl font-medium text-[var(--text-primary)]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Studio & Palestra
        </h2>
        <p className="text-sm text-[var(--text-secondary)] max-w-sm mx-auto">
          Configura eventuali fasce orarie per studio e allenamento. Sono opzionali — puoi saltare questo passo.
        </p>
      </div>

      {/* Studio Section */}
      <Card padding="md" className="overflow-hidden">
        <button
          onClick={() => setStudyOpen(!studyOpen)}
          className="w-full flex items-center justify-between p-2"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[rgba(155,89,182,0.12)] flex items-center justify-center">
              <BookOpen size={16} className="text-[#9b59b6]" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-[var(--text-primary)]">Orari studio</p>
              <p className="text-xs text-[var(--text-muted)]">
                {Object.values(formData.study_schedule).filter(d => d?.enabled).length > 0
                  ? `${Object.values(formData.study_schedule).filter(d => d?.enabled).length} giorni configurati`
                  : 'Non configurato'
                }
              </p>
            </div>
          </div>
          {studyOpen ? <ChevronUp size={16} className="text-[var(--text-muted)]" /> : <ChevronDown size={16} className="text-[var(--text-muted)]" />}
        </button>

        {studyOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="pt-3 border-t border-[var(--border-subtle)]"
          >
            <TimeBlockSelector
              mode="study"
              value={formData.study_schedule}
              onChange={(schedule) => updateFormData({ study_schedule: schedule })}
            />
          </motion.div>
        )}
      </Card>

      {/* Gym Section */}
      <Card padding="md" className="overflow-hidden">
        <button
          onClick={() => setGymOpen(!gymOpen)}
          className="w-full flex items-center justify-between p-2"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[rgba(61,153,112,0.12)] flex items-center justify-center">
              <Dumbbell size={16} className="text-[var(--color-success)]" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-[var(--text-primary)]">Orari palestra</p>
              <p className="text-xs text-[var(--text-muted)]">
                {Object.values(formData.gym_schedule).filter(d => d?.enabled).length > 0
                  ? `${Object.values(formData.gym_schedule).filter(d => d?.enabled).length} giorni configurati`
                  : 'Non configurato'
                }
              </p>
            </div>
          </div>
          {gymOpen ? <ChevronUp size={16} className="text-[var(--text-muted)]" /> : <ChevronDown size={16} className="text-[var(--text-muted)]" />}
        </button>

        {gymOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="pt-3 border-t border-[var(--border-subtle)]"
          >
            <TimeBlockSelector
              mode="gym"
              value={formData.gym_schedule}
              onChange={(schedule) => updateFormData({ gym_schedule: schedule })}
            />
          </motion.div>
        )}
      </Card>

      {/* Info */}
      <div className="flex items-start gap-3 p-3 rounded-[var(--radius-md)] bg-[var(--bg-elevated)]">
        <span className="text-lg">💡</span>
        <p className="text-xs text-[var(--text-secondary)]">
          Questi orari appariranno come blocchi nel calendario e genereranno notifiche di promemoria.
          Sono completamente opzionali.
        </p>
      </div>
    </div>
  )
}

export default StepOrariStudioGym
