import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  Upload, FileText, AlertCircle, CheckCircle2, X,
  ChevronDown, ChevronUp, TrendingUp, TrendingDown,
  Calculator, Landmark, FileUp, ArrowRight, RefreshCw
} from 'lucide-react'
import { parseExcelStatement } from '@/lib/excelImport'
import { getBankImportStats } from '@/lib/pdfImport' // riutilizziamo la funzione helper delle statistiche
import { useFinanceStore } from '@/store/useFinanceStore'
import { useAuthStore } from '@/store/useAuthStore'
import { useAppStore } from '@/store/useAppStore'
import { getAccounts } from '@/lib/accounts'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import clsx from 'clsx'

const BATCH_SIZE = 25

// ─────────────────────────────────────────────────
// Step IDs
// ─────────────────────────────────────────────────
const STEP = {
  UPLOAD:     'upload',
  PROCESSING: 'processing',
  PREVIEW:    'preview',
  IMPORTING:  'importing',
  DONE:       'done',
}

export default function BankImportPanel({ onImportDone, compact = false }) {
  const navigate = useNavigate()
  const { categories, historicalTransactions, setTransactions, setHistoricalTransactions, setCumulativeBalance } = useFinanceStore()
  const { user } = useAuthStore()
  const { userConfig, setUserConfig } = useAppStore()
  const accounts = getAccounts(userConfig)

  const fileInputRef = useRef(null)

  // ── Netto delle transazioni GIÀ presenti nel DB ──
  // Incluse nella formula del saldo iniziale per profili già in uso.
  const existingIncome  = historicalTransactions.filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount || 0), 0)
  const existingExpense = historicalTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount || 0), 0)
  const existingNet     = existingIncome - existingExpense
  const hasExistingTx  = historicalTransactions.length > 0

  // ── State ──
  const [step, setStep]                     = useState(STEP.UPLOAD)
  const [isDragging, setIsDragging]         = useState(false)
  const [fileName, setFileName]             = useState(null)
  const [parsed, setParsed]                 = useState(null)
  const [pdfProgress, setPdfProgress]       = useState({ done: 0, total: 1 })
  // Pre-compila con saldo inserito nello step precedente (onboarding)
  const [currentBalance, setCurrentBalance] = useState(
    userConfig?.initial_bank_balance ? String(userConfig.initial_bank_balance) : ''
  )
  const [selectedAccount, setSelectedAccount] = useState(accounts[0]?.id || 'bank')
  const [showErrors, setShowErrors]           = useState(false)
  const [showPreview, setShowPreview]         = useState(true)
  const [importProgress, setImportProgress]   = useState({ done: 0, total: 0 })
  const [importResult, setImportResult]       = useState(null)

  // ── Derived (solo quando parsed è disponibile) ──
  const stats = parsed ? getBankImportStats(parsed.rows, parsed.errors) : null

  // Separa movimenti Salvadanaio dai movimenti regolari
  const savingsRows  = parsed?.rows.filter(r => r._is_savings)  ?? []
  const regularRows  = parsed?.rows.filter(r => !r._is_savings) ?? []

  // Netto salvadanaio: accantonato = uscite verso savings - entrate da savings
  const savingsIncome      = savingsRows.filter(r => r.type === 'income').reduce((s, r) => s + r.amount, 0)
  const savingsExpense     = savingsRows.filter(r => r.type === 'expense').reduce((s, r) => s + r.amount, 0)
  const savingsAccumulated = savingsExpense - savingsIncome   // positivo = denaro in savings
  const hasSavingsMovements = savingsRows.length > 0

  // Netto movimenti regolari (no savings)
  const regularIncome  = regularRows.filter(r => r.type === 'income').reduce((s, r) => s + r.amount, 0)
  const regularExpense = regularRows.filter(r => r.type === 'expense').reduce((s, r) => s + r.amount, 0)
  const regularNet     = regularIncome - regularExpense

  const currentBalVal = currentBalance !== '' ? parseFloat(currentBalance.replace(',', '.')) : null

  // Formula saldo iniziale (solo movimenti regolari + tx esistenti):
  //   saldo_iniziale = saldo_libero_oggi − netto_regular − netto_già_tracciato
  // L'utente deve inserire il saldo LIBERO (escluso salvadanaio)
  const computedInitial =
    currentBalVal !== null && !isNaN(currentBalVal)
      ? currentBalVal - regularNet - existingNet
      : null

  // ─────────────────────────────────────────────────
  // File handling
  // ─────────────────────────────────────────────────
  const handleFile = useCallback(async (file) => {
    if (!file) return
    const nameLower = file.name.toLowerCase()
    const isExcel = nameLower.endsWith('.xls') || nameLower.endsWith('.xlsx')
    const isCSV = nameLower.endsWith('.csv')

    if (!isExcel && !isCSV) {
      toast.error('Carica un file Excel (.xls, .xlsx) o CSV valido')
      return
    }

    setFileName(file.name)
    setParsed(null)
    setImportResult(null)
    setStep(STEP.PROCESSING)

    try {
      // Parsing sincrono/Promise locale (SheetJS)
      const result = await parseExcelStatement(file, categories)
      setParsed(result)
      setStep(STEP.PREVIEW)
    } catch (err) {
      console.error('File parse error:', err)
      toast.error(`Errore elaborazione file: ${err.message || err}`)
      setStep(STEP.UPLOAD)
    }
  }, [categories])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
    handleFile(e.dataTransfer.files[0])
  }, [handleFile])

  // ─────────────────────────────────────────────────
  // Import
  // ─────────────────────────────────────────────────
  const handleImport = async () => {
    if (!parsed || regularRows.length === 0 || !user) return
    if (computedInitial === null) {
      toast.error('Inserisci il saldo libero del conto per continuare')
      return
    }

    setStep(STEP.IMPORTING)
    setImportProgress({ done: 0, total: regularRows.length })

    try {
      // 1. Salva saldo iniziale calcolato (solo movimenti regolari)
      const { error: cfgErr } = await supabase
        .from('user_config')
        .update({ initial_bank_balance: computedInitial })
        .eq('id', userConfig.id)

      if (!cfgErr) {
        setUserConfig({ ...userConfig, initial_bank_balance: computedInitial })
      }

      // 2. Insert solo movimenti regolari in batch con progress tracking
      // I movimenti BDR/Salvadanaio sono trasferimenti interni → esclusi
      const payload = regularRows.map(row => ({
        user_id:        user.id,
        date:           row.date,
        description:    row.description,
        amount:         row.amount,
        type:           row.type,
        category:       row.category,
        payment_method: selectedAccount,
      }))

      let importedCount = 0

      for (let i = 0; i < payload.length; i += BATCH_SIZE) {
        const batch = payload.slice(i, i + BATCH_SIZE)
        const { data, error } = await supabase
          .from('finance_transactions')
          .insert(batch)
          .select()

        if (!error) importedCount += data?.length || 0

        setImportProgress({ done: Math.min(i + BATCH_SIZE, payload.length), total: payload.length })
      }

      // 3. Ricarica tutte le transazioni
      const { data: freshTx } = await supabase
        .from('finance_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })

      if (freshTx) {
        setTransactions(freshTx)
        setHistoricalTransactions(freshTx.map(t => ({
          amount: t.amount, type: t.type, date: t.date, payment_method: t.payment_method,
        })))

        // 4. Ricalcola saldo cumulativo
        const otherAccountsBase = accounts
          .filter(a => a.id !== selectedAccount)
          .reduce((s, a) => s + parseFloat(a.initial_balance || 0), 0)
        const baseBalance = computedInitial + otherAccountsBase
        const inc = freshTx.filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount), 0)
        const exp = freshTx.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0)
        setCumulativeBalance(baseBalance + inc - exp)
      }

      setImportResult({
        imported: importedCount,
        computedInitial,
        savingsAccumulated,
        savingsCount: savingsRows.length,
        hasSavings: savingsRows.length > 0,
      })
      setStep(STEP.DONE)
      onImportDone?.()
    } catch (err) {
      console.error('Import error:', err)
      toast.error("Errore durante l'import. Riprova.")
      setStep(STEP.PREVIEW)
    }
  }

  const reset = () => {
    setParsed(null)
    setFileName(null)
    setImportResult(null)
    setCurrentBalance('')
    setImportProgress({ done: 0, total: 0 })
    setStep(STEP.UPLOAD)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ─────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      <AnimatePresence mode="wait">

        {/* ══════════════════════════════════════════
            STEP 1 — UPLOAD
        ══════════════════════════════════════════ */}
        {step === STEP.UPLOAD && (
          <motion.div key="upload" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>

            {!compact && (
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/15 mb-4">
                <FileUp size={14} className="text-[var(--color-primary)] mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-[var(--text-primary)]">Import estratto conto Excel / CSV</p>
                  <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed">
                    Carica il file Excel (.xls, .xlsx) o CSV del tuo estratto conto.
                    Il sistema rileverà automaticamente tutti i movimenti, estrarrà gli accantonamenti e calcolerà il saldo iniziale del conto libero.
                  </p>
                </div>
              </div>
            )}

            {/* Drop zone */}
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onClick={() => fileInputRef.current?.click()}
              className={clsx(
                'relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300',
                isDragging
                  ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/8 scale-[1.01]'
                  : 'border-[var(--border-default)] hover:border-[var(--color-primary)]/50 hover:bg-[var(--bg-hover)]'
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xls,.xlsx,.csv"
                className="hidden"
                onChange={(e) => handleFile(e.target.files[0])}
              />
              <motion.div animate={isDragging ? { scale: 1.05 } : { scale: 1 }} className="space-y-3">
                <div className={clsx(
                  'w-14 h-14 mx-auto rounded-2xl flex items-center justify-center transition-all duration-300',
                  isDragging ? 'bg-[var(--color-primary)]/15' : 'bg-[var(--bg-elevated)]'
                )}>
                  <Upload size={24} className={clsx(
                    'transition-colors duration-300',
                    isDragging ? 'text-[var(--color-primary)]' : 'text-[var(--text-muted)]'
                  )} />
                </div>
                <div>
                  <p className="text-sm font-bold text-[var(--text-primary)]">
                    {isDragging ? 'Rilascia il file qui' : 'Trascina il file qui'}
                  </p>
                  <p className="text-[10px] text-[var(--text-muted)] mt-1">Excel (.xls, .xlsx) o file CSV</p>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
                  <FileText size={10} className="text-[var(--text-muted)]" />
                  <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Excel / CSV</span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* ══════════════════════════════════════════
            STEP 2 — PROCESSING
        ══════════════════════════════════════════ */}
        {step === STEP.PROCESSING && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="py-12 space-y-6 text-center"
          >
            <div className="relative w-16 h-16 mx-auto">
              <div className="absolute inset-0 rounded-2xl bg-[var(--color-primary)]/10 flex items-center justify-center">
                <Loader2 size={24} className="text-[var(--color-primary)] animate-spin" />
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-black text-[var(--text-primary)]">Analisi del foglio di calcolo…</p>
              <p className="text-[10px] text-[var(--text-muted)]">
                Lettura righe e corrispondenza colonne in corso
              </p>
            </div>
          </motion.div>
        )}

        {/* ══════════════════════════════════════════
            STEP 3 — PREVIEW & CONFIGURAZIONE
        ══════════════════════════════════════════ */}
        {step === STEP.PREVIEW && parsed && (
          <motion.div
            key="preview"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="space-y-4"
          >
            {/* File badge + reset */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[var(--color-primary)]/10 flex items-center justify-center">
                  <FileText size={13} className="text-[var(--color-primary)]" />
                </div>
                <span className="text-xs font-bold text-[var(--text-primary)] truncate max-w-[160px]">{fileName}</span>
              </div>
              <button onClick={reset} className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--color-danger)] hover:bg-black/5 transition-colors">
                <X size={13} />
              </button>
            </div>

            {/* Stats chips: entrate / uscite / movimenti / salvadanaio */}
            <div className={clsx('grid gap-2', hasSavingsMovements ? 'grid-cols-4' : 'grid-cols-3')}>
              <div className="p-3 rounded-2xl bg-[var(--color-success)]/8 border border-[var(--color-success)]/15 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <TrendingUp size={10} className="text-[var(--color-success)]" />
                  <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--color-success)]">Entrate</span>
                </div>
                <p className="text-xs font-black text-[var(--text-primary)]">
                  €{regularIncome.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-[var(--color-danger)]/8 border border-[var(--color-danger)]/15 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <TrendingDown size={10} className="text-[var(--color-danger)]" />
                  <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--color-danger)]">Uscite</span>
                </div>
                <p className="text-xs font-black text-[var(--text-primary)]">
                  €{regularExpense.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <CheckCircle2 size={10} className="text-[var(--text-muted)]" />
                  <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Movimenti</span>
                </div>
                <p className="text-xs font-black text-[var(--text-primary)]">{regularRows.length}</p>
              </div>
              {hasSavingsMovements && (
                <div className="p-3 rounded-2xl bg-amber-500/8 border border-amber-500/20 text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <span className="text-[9px]">🐷</span>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-amber-500">Salvadanaio</span>
                  </div>
                  <p className="text-xs font-black text-[var(--text-primary)]">
                    €{savingsAccumulated.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              )}
            </div>

            {/* Banner Salvadanaio */}
            {hasSavingsMovements && (
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-amber-500/6 border border-amber-500/20">
                <span className="text-base shrink-0">🐷</span>
                <div className="space-y-1">
                  <p className="text-xs font-black text-[var(--text-primary)]">
                    Rilevati {savingsRows.length} movimenti Salvadanaio
                  </p>
                  <p className="text-[9px] text-[var(--text-secondary)] leading-relaxed">
                    Hai accantonato netti <strong>€{savingsAccumulated.toLocaleString('it-IT', { minimumFractionDigits: 2 })}</strong> nel Salvadanaio.
                    Questi sono trasferimenti interni e <strong>non verranno importati come transazioni</strong>: li gestirai come obiettivi nella sezione Risparmi.
                  </p>
                  <p className="text-[9px] font-bold text-amber-500">
                    → Inserisci qui sotto il saldo libero (es. €150,60), NON il totale incluso salvadanaio
                  </p>
                </div>
              </div>
            )}

            {/* Errori */}
            {parsed.errors.length > 0 && (
              <div className="rounded-2xl border border-[var(--color-warning)]/20 bg-[var(--color-warning)]/5 overflow-hidden">
                <button
                  onClick={() => setShowErrors(v => !v)}
                  className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-bold text-[var(--color-warning)]"
                >
                  <span className="flex items-center gap-2">
                    <AlertCircle size={12} />
                    {parsed.errors.length} righe non riconosciute (saltate)
                  </span>
                  {showErrors ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>
                <AnimatePresence>
                  {showErrors && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                      <div className="px-3 pb-3 space-y-1 max-h-32 overflow-y-auto">
                        {parsed.errors.slice(0, 10).map((err, i) => (
                          <div key={i} className="text-[9px] font-mono text-[var(--text-muted)] bg-black/5 rounded-lg px-2 py-1">
                            <span className="text-[var(--color-warning)] font-bold">#{err.line}</span> {err.message}
                          </div>
                        ))}
                        {parsed.errors.length > 10 && (
                          <p className="text-[9px] text-[var(--text-muted)] text-center">+{parsed.errors.length - 10} altri errori</p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Anteprima tabella */}
            <div className="rounded-2xl border border-[var(--border-subtle)] overflow-hidden">
              <button
                onClick={() => setShowPreview(v => !v)}
                className="w-full flex items-center justify-between px-3 py-2.5 bg-[var(--bg-elevated)] text-xs font-bold text-[var(--text-secondary)]"
              >
                <span>Anteprima ({Math.min(regularRows.length, 5)} di {regularRows.length} movimenti regolari)</span>
                {showPreview ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
              <AnimatePresence>
                {showPreview && (
                  <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-[10px]">
                        <thead>
                          <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-base)]">
                            <th className="px-3 py-2 text-left font-bold text-[var(--text-muted)] uppercase tracking-wider">Data</th>
                            <th className="px-3 py-2 text-left font-bold text-[var(--text-muted)] uppercase tracking-wider">Descrizione</th>
                            <th className="px-3 py-2 text-right font-bold text-[var(--text-muted)] uppercase tracking-wider">Importo</th>
                            <th className="px-3 py-2 text-left font-bold text-[var(--text-muted)] uppercase tracking-wider">Cat.</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-subtle)]">
                          {regularRows.slice(0, 5).map((row, i) => (
                            <tr key={i} className="hover:bg-[var(--bg-hover)] transition-colors">
                              <td className="px-3 py-2 font-mono text-[var(--text-secondary)] whitespace-nowrap">
                                {row.date.split('-').reverse().join('/')}
                              </td>
                              <td className="px-3 py-2 text-[var(--text-primary)] max-w-[130px] truncate">{row.description}</td>
                              <td className={clsx(
                                'px-3 py-2 text-right font-bold font-num whitespace-nowrap',
                                row.type === 'income' ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'
                              )}>
                                {row.type === 'expense' ? '-' : '+'}€{row.amount.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="px-3 py-2 text-[var(--text-muted)] max-w-[80px] truncate">
                                <span className={clsx(!row._cat_matched && 'opacity-40 italic')}>
                                  {row.category_name || '—'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {regularRows.length > 5 && (
                        <p className="px-3 py-2 text-[9px] text-[var(--text-muted)] text-center border-t border-[var(--border-subtle)]">
                          + altri {regularRows.length - 5} movimenti
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ── Calcolo saldo iniziale ── */}
            <div className="p-4 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[var(--color-primary)]/10 flex items-center justify-center">
                  <Calculator size={13} className="text-[var(--color-primary)]" />
                </div>
                <div>
                  <p className="text-xs font-black text-[var(--text-primary)]">Calcolo saldo iniziale</p>
                  <p className="text-[9px] text-[var(--text-muted)]">
                    {hasExistingTx
                      ? 'Saldo iniziale = Saldo libero − Netto PDF − Già tracciato'
                      : 'Saldo iniziale = Saldo libero − Netto movimenti PDF'
                    }
                  </p>
                </div>
              </div>

              {/* Banner profilo già in uso */}
              {hasExistingTx && (
                <div className="flex items-start gap-2 p-2.5 rounded-xl bg-[var(--color-info)]/8 border border-[var(--color-info)]/20">
                  <AlertCircle size={11} className="text-[var(--color-info)] mt-0.5 shrink-0" />
                  <p className="text-[9px] text-[var(--color-info)] leading-relaxed">
                    Il tuo profilo ha già <strong>{historicalTransactions.length}</strong> movimenti tracciati (netto{' '}
                    <strong>{existingNet >= 0 ? '+' : ''}€{Math.abs(existingNet).toLocaleString('it-IT', { minimumFractionDigits: 2 })}</strong>).
                    Vengono inclusi nel calcolo per garantire coerenza.
                  </p>
                </div>
              )}

              <Input
                label={hasSavingsMovements ? 'Saldo libero del conto (escluso salvadanaio)' : 'Saldo attuale del conto (oggi)'}
                type="number"
                prefix="€"
                placeholder={hasSavingsMovements ? 'es. 150.60' : 'es. 749.60'}
                value={currentBalance}
                onChange={(e) => setCurrentBalance(e.target.value)}
                helper={hasSavingsMovements
                  ? `Il saldo che hai disponibile escluso i ${savingsAccumulated.toLocaleString('it-IT', { minimumFractionDigits: 2 })}€ accantonati`
                  : 'Il saldo che vedi oggi nella tua app bancaria'
                }
              />

              <AnimatePresence>
                {computedInitial !== null && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={clsx('grid gap-2 text-center', hasExistingTx ? 'grid-cols-4' : 'grid-cols-3')}
                  >
                    <div className="p-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                      <p className="text-[8px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-0.5">Oggi</p>
                      <p className="text-xs font-black text-[var(--color-primary)]">
                        €{currentBalVal.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="p-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                      <p className="text-[8px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-0.5">Netto PDF</p>
                      <p className={clsx('text-xs font-black', regularNet >= 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]')}>
                        {regularNet >= 0 ? '+' : '−'}€{Math.abs(regularNet).toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    {hasExistingTx && (
                      <div className="p-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                        <p className="text-[8px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-0.5">Tracciato</p>
                        <p className={clsx('text-xs font-black', existingNet >= 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]')}>
                          {existingNet >= 0 ? '+' : '−'}€{Math.abs(existingNet).toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    )}
                    <div className="p-2 rounded-xl bg-[var(--color-primary)]/8 border border-[var(--color-primary)]/20">
                      <p className="text-[8px] font-bold uppercase tracking-wider text-[var(--color-primary)] mb-0.5">Iniziale</p>
                      <p className="text-xs font-black text-[var(--text-primary)]">
                        €{computedInitial.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Selezione conto */}
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">
                Associa al conto
              </p>
              <div className="flex flex-wrap gap-2">
                {accounts.map(acc => (
                  <button
                    key={acc.id}
                    onClick={() => setSelectedAccount(acc.id)}
                    className={clsx(
                      'flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all',
                      selectedAccount === acc.id
                        ? 'border-[var(--color-primary)]/40 bg-[var(--color-primary)]/8 text-[var(--color-primary)]'
                        : 'border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                    )}
                  >
                    <Landmark size={12} />
                    {acc.name}
                    {selectedAccount === acc.id && <CheckCircle2 size={11} />}
                  </button>
                ))}
              </div>
            </div>

            {/* CTA */}
            <Button
              variant="primary"
              size="md"
              className="w-full"
              onClick={handleImport}
              disabled={regularRows.length === 0 || computedInitial === null}
              iconRight={ArrowRight}
            >
              {computedInitial === null
                ? `Inserisci il saldo ${hasSavingsMovements ? 'libero' : 'attuale'} per continuare`
                : `Importa ${regularRows.length} movimenti`
              }
            </Button>
          </motion.div>
        )}

        {/* ══════════════════════════════════════════
            STEP 4 — IMPORTING (live progress)
        ══════════════════════════════════════════ */}
        {step === STEP.IMPORTING && (
          <motion.div
            key="importing"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="py-8 space-y-6 text-center"
          >
            <div className="relative w-16 h-16 mx-auto">
              <div className="absolute inset-0 rounded-2xl bg-[var(--color-primary)]/10 flex items-center justify-center">
                <Upload size={22} className="text-[var(--color-primary)]" />
              </div>
              <motion.div
                className="absolute -inset-1.5 rounded-[20px] border-2 border-[var(--color-primary)]/30"
                animate={{ rotate: 360 }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                style={{
                  background: 'conic-gradient(from 0deg, var(--color-primary) 0deg, transparent 270deg)',
                  WebkitMask: 'padding-box',
                }}
              />
            </div>

            <div className="space-y-1">
              <p className="text-sm font-black text-[var(--text-primary)]">Importazione in corso…</p>
              <p className="text-xs text-[var(--text-secondary)] font-num tabular-nums">
                {importProgress.done} di {importProgress.total} movimenti
              </p>
            </div>

            {/* Progress bar con shimmer */}
            <div className="max-w-xs mx-auto space-y-2">
              <div className="w-full h-3 rounded-full bg-[var(--bg-elevated)] overflow-hidden">
                <motion.div
                  className="h-full rounded-full relative overflow-hidden"
                  style={{ background: 'linear-gradient(90deg, var(--color-primary), color-mix(in srgb, var(--color-primary) 70%, white))' }}
                  initial={{ width: '0%' }}
                  animate={{
                    width: importProgress.total > 0
                      ? `${Math.round((importProgress.done / importProgress.total) * 100)}%`
                      : '0%'
                  }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent"
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                  />
                </motion.div>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-[var(--text-muted)]">Caricamento…</span>
                <span className="font-black text-[var(--color-primary)] font-num tabular-nums">
                  {importProgress.total > 0
                    ? `${Math.round((importProgress.done / importProgress.total) * 100)}%`
                    : '0%'
                  }
                </span>
              </div>
            </div>

            <p className="text-[9px] text-[var(--text-muted)] opacity-60">Non chiudere questa finestra</p>
          </motion.div>
        )}

        {/* ══════════════════════════════════════════
            STEP 5 — DONE
        ══════════════════════════════════════════ */}
        {step === STEP.DONE && importResult && (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="py-6 space-y-5"
          >
            {/* Checkmark + titolo */}
            <div className="text-center space-y-3">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.1 }}
                className="w-16 h-16 mx-auto rounded-2xl bg-[var(--color-success)]/12 flex items-center justify-center"
              >
                <CheckCircle2 size={28} className="text-[var(--color-success)]" />
              </motion.div>
              <div>
                <p className="text-base font-black text-[var(--text-primary)]">Import completato!</p>
                <p className="text-sm text-[var(--text-secondary)]">
                  {importResult.imported} movimenti regolari importati
                  {importResult.hasSavings && ` · ${importResult.savingsCount} savings esclusi`}
                </p>
              </div>
            </div>

            {/* Riepilogo saldo */}
            <div className="p-4 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--text-muted)]">Movimenti regolari importati</span>
                <span className="font-black text-[var(--text-primary)]">{importResult.imported}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--text-muted)]">Saldo iniziale impostato</span>
                <span className="font-black text-[var(--color-primary)]">
                  €{importResult.computedInitial.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--text-muted)]">Conto</span>
                <span className="font-bold text-[var(--text-secondary)]">
                  {accounts.find(a => a.id === selectedAccount)?.name || selectedAccount}
                </span>
              </div>
            </div>

            {/* Card Salvadanaio — CTA verso Risparmi */}
            {importResult.hasSavings && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="p-4 rounded-2xl bg-amber-500/6 border border-amber-500/20 space-y-3"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/12 flex items-center justify-center text-lg shrink-0">
                    🐷
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-black text-[var(--text-primary)]">
                      Hai €{importResult.savingsAccumulated.toLocaleString('it-IT', { minimumFractionDigits: 2 })} nel Salvadanaio
                    </p>
                    <p className="text-[9px] text-[var(--text-secondary)] leading-relaxed">
                      Questa cifra è già accantonata nel tuo conto, ma non è ancora tracciata come obiettivo in VitaOS.
                      Crea i tuoi piani di risparmio e indica quanto hai già messo da parte per ognuno.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/risparmi')}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 text-xs font-bold text-amber-500 transition-all"
                >
                  <span>🐷</span>
                  Vai ai Risparmi · distribuisci €{importResult.savingsAccumulated.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                </button>
              </motion.div>
            )}

            <Button size="sm" variant="ghost" icon={RefreshCw} onClick={reset} className="w-full">
              Importa un altro file
            </Button>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  )
}
