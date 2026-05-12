import { motion } from 'framer-motion'
import { Sparkles, LayoutDashboard, Calendar, Wallet, PiggyBank, Heart, FileSignature, StickyNote } from 'lucide-react'

const features = [
  { icon: LayoutDashboard, label: 'Overview',    color: 'var(--color-primary)',  desc: 'Panoramica completa' },
  { icon: Calendar,        label: 'Calendario',  color: '#4a90d9',              desc: 'Eventi e ferie' },
  { icon: FileSignature,   label: 'Firme',       color: '#3d9970',              desc: 'Registro ore' },
  { icon: Wallet,          label: 'Finanze',     color: '#d4a017',              desc: 'Entrate e uscite' },
  { icon: PiggyBank,       label: 'Risparmi',    color: 'var(--color-primary)', desc: 'Piani di accumulo' },
  { icon: Heart,           label: 'Salute',      color: '#e05252',              desc: 'Workout e corsa' },
  { icon: StickyNote,      label: 'Note',        color: '#9b59b6',              desc: 'Appunti e idee' },
]

function StepDone({ formData, onFinish }) {
  const salary = parseFloat(formData.monthly_net_income) || 0
  const bank = parseFloat(formData.initial_bank_balance) || 0
  const cash = parseFloat(formData.initial_cash_balance) || 0

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="text-center space-y-3">
        <motion.div
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
          className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, rgba(180,98,67,0.15), rgba(61,153,112,0.15))' }}
        >
          <Sparkles size={36} className="text-[var(--color-primary)]" />
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-3xl font-medium text-[var(--text-primary)]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Tutto pronto!
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-sm text-[var(--text-secondary)] max-w-md mx-auto"
        >
          La tua dashboard personale è configurata. Ecco un riepilogo di cosa hai impostato.
        </motion.p>
      </div>

      {/* Summary */}
      {(salary > 0 || bank > 0 || cash > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="grid grid-cols-3 gap-3"
        >
          {salary > 0 && (
            <div className="text-center p-3 rounded-[var(--radius-lg)] bg-[var(--bg-elevated)]">
              <p className="text-xs text-[var(--text-muted)]">Stipendio</p>
              <p className="text-lg font-semibold font-num text-[var(--text-primary)]">
                €{salary.toLocaleString('it-IT')}
              </p>
            </div>
          )}
          {bank > 0 && (
            <div className="text-center p-3 rounded-[var(--radius-lg)] bg-[var(--bg-elevated)]">
              <p className="text-xs text-[var(--text-muted)]">Conto</p>
              <p className="text-lg font-semibold font-num text-[var(--text-primary)]">
                €{bank.toLocaleString('it-IT')}
              </p>
            </div>
          )}
          {cash > 0 && (
            <div className="text-center p-3 rounded-[var(--radius-lg)] bg-[var(--bg-elevated)]">
              <p className="text-xs text-[var(--text-muted)]">Contante</p>
              <p className="text-lg font-semibold font-num text-[var(--text-primary)]">
                €{cash.toLocaleString('it-IT')}
              </p>
            </div>
          )}
        </motion.div>
      )}

      {/* Feature grid preview */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <p className="text-xs text-[var(--text-muted)] text-center mb-3 uppercase tracking-wider font-medium">
          I tuoi moduli
        </p>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
          {features.map((f, i) => (
            <motion.div
              key={f.label}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.45 + i * 0.05, type: 'spring', stiffness: 300, damping: 20 }}
              className="flex flex-col items-center gap-1.5 p-3 rounded-[var(--radius-md)] bg-[var(--bg-elevated)]"
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${f.color}15` }}
              >
                <f.icon size={18} style={{ color: f.color }} />
              </div>
              <span className="text-[10px] font-medium text-[var(--text-secondary)] text-center leading-tight">
                {f.label}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Motivational message */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="text-center p-4 rounded-[var(--radius-lg)] border border-[var(--border-subtle)]
          bg-gradient-to-br from-[var(--bg-surface)] to-[var(--bg-elevated)]"
      >
        <p className="text-lg mb-1">🚀</p>
        <p className="text-sm text-[var(--text-primary)] font-medium" style={{ fontFamily: 'var(--font-display)' }}>
          Premi "Inizia ad usare VitaOS" per entrare nella tua dashboard
        </p>
        <p className="text-xs text-[var(--text-muted)] mt-1">
          Potrai sempre modificare queste impostazioni dal pannello Impostazioni
        </p>
      </motion.div>
    </div>
  )
}

export default StepDone
