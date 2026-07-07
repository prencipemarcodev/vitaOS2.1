import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload, FileText, AlertCircle, CheckCircle2, X,
  Download, ChevronDown, ChevronUp, Loader2, TrendingUp,
  TrendingDown, Info, Calculator, Landmark
} from 'lucide-react'
import { parseCSV, generateCSVTemplate, getImportStats } from '@/lib/csvImport'
import { useFinanceStore } from '@/store/useFinanceStore'
import { useAuthStore } from '@/store/useAuthStore'
import { useAppStore } from '@/store/useAppStore'
import { getAccounts } from '@/lib/accounts'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import clsx from 'clsx'

const BATCH_SIZE = 50

function CSVImportPanel({ onImportDone, compact = false }) {
  const {
    categories,
    setTransactions,
    setHistoricalTransactions,
    setCumulativeBalance,
  } = useFinanceStore()
  const { user } = useAuthStore()
  const { userConfig, setUserConfig } = useAppStore()
  const accounts = getAccounts(userConfig)

  const fileInputRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)
  const [fileName, setFileName] = useState(null)
  const [parsed, setParsed] = useState(null) // { rows, errors, totalLines }
  const [currentBalance, setCurrentBalance] = useState('')
  const [selectedAccount, setSelectedAccount] = useState(accounts[0]?.id || 'bank')
  const [showErrors, setShowErrors] = useState(false)
  const [showPreview, setShowPreview] = useState(true)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState(null)

  // ── Calcolo saldo iniziale ──
  // Saldo iniziale = Saldo attuale - Somma netta movimenti
  const stats = parsed ? getImportStats(parsed.rows, parsed.errors) : null
  const currentBalVal = parseFloat(currentBalance.replace(',', '.')) || null
  const computedInitial =
    currentBalVal !== null && stats
      ? currentBalVal - stats.netBalance
      : null

  const handleFile = useCallback(
    (file) => {
      if (!file || !file.name.endsWith('.csv')) {
        toast.error('Carica un file CSV valido (.csv)')
        return
      }
      setFileName(file.name)
      setParsed(null)
      setImportResult(null)

      const reader = new FileReader()
      reader.onload = (e) => {
        const result = parseCSV(e.target.result, categories)
        setParsed(result)
      }
      reader.readAsText(file, 'UTF-8')
    },
    [categories]
  )

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault()
      setIsDragging(false)
      handleFile(e.dataTransfer.files[0])
    },
    [handleFile]
  )

  const handleDownloadTemplate = () => {
    const blob = new Blob([generateCSVTemplate()], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'template_movimenti.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = async () => {
    if (!parsed || parsed.rows.length === 0 || !user) return
    if (computedInitial === null) {
      toast.error('Inserisci il saldo attuale del conto per continuare')
      return
    }

    setImporting(true)
    try {
      // 1. Aggiorna il saldo iniziale nel profilo utente
      const updatedConfig = {
        ...userConfig,
        initial_bank_balance: computedInitial,
      }
      const { error: cfgErr } = await supabase
        .from('user_config')
        .update({ initial_bank_balance: computedInitial })
        .eq('id', userConfig.id)

      if (!cfgErr) {
        setUserConfig(updatedConfig)
      }

      // 2. Inserisci i movimenti su Supabase in batch
      const payload = parsed.rows.map((row) => ({
        user_id: user.id,
        date: row.date,
        description: row.description,
        amount: row.amount,
        type: row.type,
        category: row.category,
        payment_method: selectedAccount,
      }))

      let importedCount = 0
      const batchErrors = []

      for (let i = 0; i < payload.length; i += BATCH_SIZE) {
        const batch = payload.slice(i, i + BATCH_SIZE)
        const { data, error } = await supabase
          .from('finance_transactions')
          .insert(batch)
          .select()

        if (error) batchErrors.push(error.message)
        else importedCount += data?.length || 0
      }

      // 3. Ricarica le transazioni
      const { data: freshTx } = await supabase
        .from('finance_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })

      if (freshTx) {
        setTransactions(freshTx)
        setHistoricalTransactions(
          freshTx.map((t) => ({
            amount: t.amount,
            type: t.type,
            date: t.date,
            payment_method: t.payment_method,
          }))
        )

        // 4. Ricalcola il saldo cumulativo con il nuovo saldo iniziale
        const baseBalance =
          computedInitial +
          accounts
            .filter((a) => a.id !== selectedAccount && a.id !== 'bank')
            .reduce((s, a) => s + parseFloat(a.initial_balance || 0), 0)

        const inc = freshTx
          .filter((t) => t.type === 'income')
          .reduce((s, t) => s + parseFloat(t.amount || 0), 0)
        const exp = freshTx
          .filter((t) => t.type === 'expense')
          .reduce((s, t) => s + parseFloat(t.amount || 0), 0)

        setCumulativeBalance(baseBalance + inc - exp)
      }

      setImportResult({ imported: importedCount, errors: batchErrors.length, computedInitial })
      toast.success(`✅ ${importedCount} movimenti importati! Saldo iniziale impostato a €${computedInitial.toLocaleString('it-IT', { minimumFractionDigits: 2 })}`)
      onImportDone?.()
    } catch (err) {
      console.error('Import error:', err)
      toast.error("Errore durante l'import. Riprova.")
    } finally {
      setImporting(false)
    }
  }

  const reset = () => {
    setParsed(null)
    setFileName(null)
    setImportResult(null)
    setCurrentBalance('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="space-y-4">
      {/* ── Info formato ── */}
      {!compact && (
        <div className="flex items-start gap-3 p-3 rounded-2xl bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/15">
          <Info size={14} className="text-[var(--color-primary)] mt-0.5 shrink-0" />
          <div className="space-y-1.5">
            <p className="text-xs font-bold text-[var(--text-primary)]">Come funziona</p>
            <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed">
              Carica il CSV degli estratti conto e inserisci il tuo <strong>saldo attuale</strong>.
              VitaOS calcolerà automaticamente il saldo iniziale (prima di tutti i movimenti importati)
              e registrerà ogni transazione nello storico.
            </p>
            <p className="text-[10px] text-[var(--text-muted)] font-mono bg-black/5 rounded-lg px-2 py-1">
              data;descrizione;importo;tipo;categoria
            </p>
            <button
              onClick={handleDownloadTemplate}
              className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--color-primary)] hover:underline"
            >
              <Download size={10} />
              Scarica template di esempio
            </button>
          </div>
        </div>
      )}

      {/* ── Risultato finale ── */}
      <AnimatePresence>
        {importResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-5 rounded-2xl bg-[var(--color-success)]/8 border border-[var(--color-success)]/20 text-center space-y-3"
          >
            <div className="w-12 h-12 mx-auto rounded-2xl bg-[var(--color-success)]/12 flex items-center justify-center">
              <CheckCircle2 size={24} className="text-[var(--color-success)]" />
            </div>
            <div>
              <p className="text-sm font-black text-[var(--text-primary)]">Import completato!</p>
              <p className="text-xs text-[var(--text-secondary)]">
                {importResult.imported} movimenti importati
                {importResult.errors > 0 && ` • ${importResult.errors} errori`}
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Saldo iniziale impostato a{' '}
                <span className="font-bold text-[var(--text-primary)]">
                  €{importResult.computedInitial?.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                </span>
              </p>
            </div>
            <Button size="xs" variant="ghost" onClick={reset}>
              Importa un altro file
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {!importResult && (
        <>
          {/* ── Drop zone ── */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onClick={() => fileInputRef.current?.click()}
            className={clsx(
              'relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200',
              isDragging
                ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/8 scale-[1.01]'
                : 'border-[var(--border-default)] hover:border-[var(--color-primary)]/50 hover:bg-[var(--bg-hover)]'
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => handleFile(e.target.files[0])}
            />

            <AnimatePresence mode="wait">
              {fileName ? (
                <motion.div key="file" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-1">
                  <div className="w-10 h-10 mx-auto rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center">
                    <FileText size={20} className="text-[var(--color-primary)]" />
                  </div>
                  <p className="text-sm font-bold text-[var(--text-primary)]">{fileName}</p>
                  {parsed && (
                    <p className="text-[10px] text-[var(--text-muted)]">
                      {parsed.rows.length} movimenti validi trovati
                    </p>
                  )}
                </motion.div>
              ) : (
                <motion.div key="empty" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                  <div className={clsx(
                    'w-10 h-10 mx-auto rounded-xl flex items-center justify-center transition-colors',
                    isDragging ? 'bg-[var(--color-primary)]/15' : 'bg-[var(--bg-elevated)]'
                  )}>
                    <Upload size={20} className={isDragging ? 'text-[var(--color-primary)]' : 'text-[var(--text-muted)]'} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[var(--text-primary)]">
                      {isDragging ? 'Rilascia il file qui' : 'Trascina il CSV qui'}
                    </p>
                    <p className="text-[10px] text-[var(--text-muted)]">oppure clicca per selezionarlo</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {fileName && (
              <button
                onClick={(e) => { e.stopPropagation(); reset() }}
                className="absolute top-2 right-2 p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--color-danger)] hover:bg-black/5"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* ── Sezione post-parsing ── */}
          <AnimatePresence>
            {parsed && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* Stats chips */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-3 rounded-2xl bg-[var(--color-success)]/8 border border-[var(--color-success)]/15 text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <TrendingUp size={11} className="text-[var(--color-success)]" />
                      <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--color-success)]">Entrate</span>
                    </div>
                    <p className="text-sm font-black text-[var(--text-primary)]">
                      €{stats.totalIncome.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="p-3 rounded-2xl bg-[var(--color-danger)]/8 border border-[var(--color-danger)]/15 text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <TrendingDown size={11} className="text-[var(--color-danger)]" />
                      <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--color-danger)]">Uscite</span>
                    </div>
                    <p className="text-sm font-black text-[var(--text-primary)]">
                      €{stats.totalExpense.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="p-3 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <CheckCircle2 size={11} className="text-[var(--text-muted)]" />
                      <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Validi</span>
                    </div>
                    <p className="text-sm font-black text-[var(--text-primary)]">{stats.validCount}</p>
                  </div>
                </div>

                {/* ── Calcolo saldo iniziale ── */}
                <div className="p-4 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[var(--color-primary)]/10 flex items-center justify-center">
                      <Calculator size={13} className="text-[var(--color-primary)]" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-[var(--text-primary)]">Calcolo saldo iniziale</p>
                      <p className="text-[9px] text-[var(--text-muted)]">Saldo iniziale = Saldo attuale − Saldo netto movimenti</p>
                    </div>
                  </div>

                  <Input
                    label="Saldo attuale del conto (€)"
                    type="number"
                    prefix="€"
                    placeholder="es. 749,60"
                    value={currentBalance}
                    onChange={(e) => setCurrentBalance(e.target.value)}
                    helper="Il saldo che hai oggi sul conto"
                  />

                  <AnimatePresence>
                    {computedInitial !== null && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-3 gap-2 text-center"
                      >
                        {/* Saldo attuale */}
                        <div className="p-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                          <p className="text-[8px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-0.5">Saldo ora</p>
                          <p className="text-xs font-black text-[var(--color-primary)]">
                            €{currentBalVal.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        {/* Netto movimenti */}
                        <div className="p-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                          <p className="text-[8px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-0.5">Netto storico</p>
                          <p className={clsx(
                            'text-xs font-black',
                            stats.netBalance >= 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'
                          )}>
                            {stats.netBalance >= 0 ? '+' : ''}€{stats.netBalance.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        {/* Saldo iniziale */}
                        <div className="p-2 rounded-xl bg-[var(--color-primary)]/8 border border-[var(--color-primary)]/20">
                          <p className="text-[8px] font-bold uppercase tracking-wider text-[var(--color-primary)] mb-0.5">Saldo iniziale</p>
                          <p className="text-xs font-black text-[var(--text-primary)]">
                            €{computedInitial.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Errori CSV */}
                {parsed.errors.length > 0 && (
                  <div className="rounded-2xl border border-[var(--color-warning)]/20 bg-[var(--color-warning)]/5 overflow-hidden">
                    <button
                      onClick={() => setShowErrors((v) => !v)}
                      className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-bold text-[var(--color-warning)]"
                    >
                      <span className="flex items-center gap-2">
                        <AlertCircle size={13} />
                        {parsed.errors.length} rig{parsed.errors.length > 1 ? 'he' : 'a'} con errori (verranno saltate)
                      </span>
                      {showErrors ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    </button>
                    <AnimatePresence>
                      {showErrors && (
                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                          <div className="px-3 pb-3 space-y-1 max-h-40 overflow-y-auto">
                            {parsed.errors.map((err, i) => (
                              <div key={i} className="text-[9px] text-[var(--text-secondary)] font-mono bg-black/5 rounded-lg px-2 py-1">
                                <span className="font-bold text-[var(--color-warning)]">Riga {err.line}:</span>{' '}{err.message}
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Anteprima tabella */}
                {parsed.rows.length > 0 && (
                  <div className="rounded-2xl border border-[var(--border-subtle)] overflow-hidden">
                    <button
                      onClick={() => setShowPreview((v) => !v)}
                      className="w-full flex items-center justify-between px-3 py-2.5 bg-[var(--bg-elevated)] text-xs font-bold text-[var(--text-secondary)]"
                    >
                      <span>Anteprima ({Math.min(parsed.rows.length, 5)} di {parsed.rows.length})</span>
                      {showPreview ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
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
                                  <th className="px-3 py-2 text-left font-bold text-[var(--text-muted)] uppercase tracking-wider">Categoria</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[var(--border-subtle)]">
                                {parsed.rows.slice(0, 5).map((row, i) => (
                                  <tr key={i} className="hover:bg-[var(--bg-hover)] transition-colors">
                                    <td className="px-3 py-2 font-mono text-[var(--text-secondary)]">
                                      {row.date.split('-').reverse().join('/')}
                                    </td>
                                    <td className="px-3 py-2 text-[var(--text-primary)] max-w-[120px] truncate">
                                      {row.description}
                                    </td>
                                    <td className={clsx(
                                      'px-3 py-2 text-right font-bold font-num',
                                      row.type === 'income' ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'
                                    )}>
                                      {row.type === 'expense' ? '-' : '+'}€{row.amount.toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-3 py-2 text-[var(--text-muted)]">
                                      <span className={clsx(!row._cat_matched && 'opacity-50 italic')}>
                                        {row.category_name || '—'}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            {parsed.rows.length > 5 && (
                              <p className="px-3 py-2 text-[9px] text-[var(--text-muted)] text-center border-t border-[var(--border-subtle)]">
                                + altri {parsed.rows.length - 5} movimenti
                              </p>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Selezione conto */}
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5 block">
                    Associa al conto
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {accounts.map((acc) => (
                      <button
                        key={acc.id}
                        onClick={() => setSelectedAccount(acc.id)}
                        className={clsx(
                          'flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all',
                          selectedAccount === acc.id
                            ? 'border-[var(--color-primary)]/40 bg-[var(--color-primary)]/8'
                            : 'border-[var(--border-subtle)] hover:bg-[var(--bg-hover)]'
                        )}
                      >
                        <div
                          className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                          style={{ backgroundColor: `${acc.color}15`, color: acc.color }}
                        >
                          <Landmark size={12} />
                        </div>
                        <span className="text-xs font-bold text-[var(--text-primary)] truncate">{acc.name}</span>
                        {selectedAccount === acc.id && (
                          <CheckCircle2 size={12} className="text-[var(--color-primary)] ml-auto shrink-0" />
                        )}
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
                  disabled={importing || parsed.rows.length === 0 || computedInitial === null}
                  icon={importing ? Loader2 : Upload}
                >
                  {importing
                    ? 'Importazione in corso...'
                    : computedInitial === null
                      ? 'Inserisci il saldo attuale per continuare'
                      : `Importa ${stats.validCount} movimenti`
                  }
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  )
}

export default CSVImportPanel
