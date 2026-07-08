import { motion } from 'framer-motion'
import { FileUp } from 'lucide-react'
import BankImportPanel from '@/pages/Impostazioni/BankImportPanel'

function StepImportMovimenti({ formData, updateFormData, onFinish }) {
  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="text-center space-y-2">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
          className="w-16 h-16 mx-auto rounded-2xl bg-[rgba(74,144,217,0.12)] flex items-center justify-center"
        >
          <FileUp size={28} className="text-[var(--color-info)]" />
        </motion.div>
        <h2
          className="text-2xl font-medium text-[var(--text-primary)]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Storico movimenti
        </h2>
        <p className="text-sm text-[var(--text-secondary)] max-w-sm mx-auto">
          Carica il file Excel (.xls, .xlsx) o CSV del tuo estratto conto: VitaOS estrarrà automaticamente
          tutti i movimenti e calcolerà il saldo iniziale del tuo conto libero.
          Puoi saltare questo passaggio e farlo in seguito dalle Impostazioni.
        </p>
      </div>

      {/* Panel */}
      <BankImportPanel
        compact={false}
        isOnboarding={true}
        onImportDone={() => {
          // Segna che l'import è stato effettuato, ma non forza avanzamento
          updateFormData({ bank_import_done: true })
        }}
      />
    </div>
  )
}

export default StepImportMovimenti
