import { motion } from 'framer-motion'
import { Landmark, Banknote } from 'lucide-react'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'

function StepSaldoIniziale({ formData, updateFormData }) {
  const bankVal = parseFloat(formData.initial_bank_balance) || 0
  const cashVal = parseFloat(formData.initial_cash_balance) || 0
  const total = bankVal + cashVal

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="text-center space-y-2">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
          className="w-16 h-16 mx-auto rounded-2xl bg-[rgba(61,153,112,0.12)] flex items-center justify-center"
        >
          <Landmark size={28} className="text-[var(--color-success)]" />
        </motion.div>
        <h2
          className="text-2xl font-medium text-[var(--text-primary)]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Saldo iniziale
        </h2>
        <p className="text-sm text-[var(--text-secondary)] max-w-sm mx-auto">
          Inserisci il saldo attuale del tuo conto corrente e del contante a disposizione.
          Servirà come punto di partenza per il tracciamento finanziario.
        </p>
      </div>

      {/* Bank balance */}
      <Card padding="lg" className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[rgba(74,144,217,0.12)] flex items-center justify-center">
            <Landmark size={20} className="text-[var(--color-info)]" />
          </div>
          <div className="flex-1">
            <Input
              label="Saldo conto corrente"
              type="number"
              prefix="€"
              placeholder="3500"
              value={formData.initial_bank_balance}
              onChange={(e) => updateFormData({ initial_bank_balance: e.target.value })}
              helper="Il saldo attuale del tuo conto principale"
            />
          </div>
        </div>
      </Card>

      {/* Cash balance */}
      <Card padding="lg" className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[rgba(61,153,112,0.12)] flex items-center justify-center">
            <Banknote size={20} className="text-[var(--color-success)]" />
          </div>
          <div className="flex-1">
            <Input
              label="Contante a disposizione"
              type="number"
              prefix="€"
              placeholder="150"
              value={formData.initial_cash_balance}
              onChange={(e) => updateFormData({ initial_cash_balance: e.target.value })}
              helper="Contanti che hai nel portafoglio o a casa"
            />
          </div>
        </div>
      </Card>

      {/* Total preview */}
      {(bankVal > 0 || cashVal > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center p-4 rounded-[var(--radius-lg)] bg-[var(--bg-elevated)]"
        >
          <p className="text-xs text-[var(--text-muted)] mb-1">Disponibilità totale</p>
          <p
            className="text-3xl font-semibold font-num"
            style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-display)' }}
          >
            €{total.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
          </p>
          <div className="flex items-center justify-center gap-4 mt-2 text-xs text-[var(--text-secondary)]">
            <span>🏦 Conto: €{bankVal.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</span>
            <span>💵 Cash: €{cashVal.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</span>
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default StepSaldoIniziale
