import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Square, Pause, Play, ChevronLeft, Coffee, Briefcase, Clock } from 'lucide-react'
import { useFirmeStore } from '@/store/useFirmeStore'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { toast } from 'sonner'
import clsx from 'clsx'

function formatTime(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  if (h > 0) return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function formatHM(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

function SaveModal({ isOpen, elapsed, checkIn, onSave, onCancel }) {
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    await onSave(notes)
    setLoading(false)
  }

  if (!isOpen) return null

  const checkOut = format(new Date(), 'HH:mm')

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[20000] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 35 }}
        className="w-full max-w-sm bg-[var(--bg-surface)] rounded-3xl p-6 shadow-2xl"
      >
        <h3 className="text-base font-black mb-1">Termina sessione</h3>
        <p className="text-xs text-[var(--text-muted)] mb-5">
          {checkIn} → {checkOut} · <span className="font-bold text-[var(--text-primary)]">{formatHM(elapsed)}</span>
        </p>

        <div className="space-y-2 mb-5">
          <label className="text-xs font-bold text-[var(--text-secondary)]">Note (opzionale)</label>
          <textarea
            rows={3}
            placeholder="Es: Riunione mattutina, sviluppo feature X..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-2xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-ghost)]"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-2xl border border-[var(--border-subtle)] text-sm font-bold text-[var(--text-muted)]"
          >
            Annulla
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 py-3 rounded-2xl bg-[var(--color-primary)] text-white text-sm font-black shadow-lg disabled:opacity-60"
          >
            {loading ? 'Salvo...' : 'Salva Sessione'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

function WorkTimer({ onClose }) {
  const { addSession } = useFirmeStore()

  const [status, setStatus] = useState('running') // running | paused
  const [elapsed, setElapsed] = useState(0)
  const [pauseElapsed, setPauseElapsed] = useState(0) // secondi in pausa totali
  const [showSave, setShowSave] = useState(false)
  const [pauseStart, setPauseStart] = useState(null)

  const checkInRef = useRef(format(new Date(), 'HH:mm'))
  const checkInDateRef = useRef(format(new Date(), 'yyyy-MM-dd'))
  const timerRef = useRef(null)
  const pauseTimerRef = useRef(null)

  // Timer attivo
  const startTicking = useCallback(() => {
    if (timerRef.current) return
    timerRef.current = setInterval(() => setElapsed(s => s + 1), 1000)
  }, [])

  const stopTicking = useCallback(() => {
    clearInterval(timerRef.current)
    timerRef.current = null
  }, [])

  // Timer pausa
  const startPauseTicking = useCallback(() => {
    if (pauseTimerRef.current) return
    const start = Date.now()
    setPauseStart(start)
    pauseTimerRef.current = setInterval(() => {
      setPauseElapsed(prev => prev + 1)
    }, 1000)
  }, [])

  const stopPauseTicking = useCallback(() => {
    clearInterval(pauseTimerRef.current)
    pauseTimerRef.current = null
    setPauseStart(null)
  }, [])

  useEffect(() => {
    startTicking()
    return () => {
      stopTicking()
      stopPauseTicking()
    }
  }, [])

  const handlePause = () => {
    setStatus('paused')
    stopTicking()
    startPauseTicking()
  }

  const handleResume = () => {
    setStatus('running')
    stopPauseTicking()
    startTicking()
  }

  const handleStop = () => {
    stopTicking()
    stopPauseTicking()
    setShowSave(true)
  }

  const handleSave = async (notes) => {
    const checkOut = format(new Date(), 'HH:mm')
    const [h1, m1] = checkInRef.current.split(':').map(Number)
    const [h2, m2] = checkOut.split(':').map(Number)
    const duration = Math.max(1, (h2 * 60 + m2) - (h1 * 60 + m1))

    try {
      const payload = {
        date: checkInDateRef.current,
        check_in: checkInRef.current,
        check_out: checkOut,
        duration_minutes: duration,
        notes: notes || null,
        is_manual: false,
      }
      const { data, error } = await supabase
        .from('work_sessions')
        .insert(payload)
        .select()
        .single()
      if (error) throw error
      addSession(data)
      toast.success(`Sessione salvata — ${formatHM(elapsed)}`)
      onClose()
    } catch (err) {
      toast.error('Errore nel salvataggio')
      console.error(err)
    }
  }

  const isPaused = status === 'paused'

  // Colori in base allo stato
  const primaryColor = isPaused ? '#ff851b' : 'var(--color-primary)'
  const bgClass = isPaused ? 'bg-orange-50' : 'bg-[var(--color-primary-ghost)]'

  return createPortal(
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ type: 'spring', stiffness: 400, damping: 35 }}
        className="fixed inset-0 z-[9999] bg-[var(--bg-base)] flex flex-col"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]">
          <button
            onClick={onClose}
            className="flex items-center gap-1 text-xs font-bold text-[var(--color-primary)]"
          >
            <ChevronLeft size={16} />
            Indietro
          </button>
          <div className="flex items-center gap-2">
            <div className={clsx(
              'w-2 h-2 rounded-full',
              isPaused ? 'bg-orange-500' : 'bg-green-500 animate-pulse'
            )} />
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
              {isPaused ? 'In pausa' : 'Sessione attiva'}
            </span>
          </div>
          <div className="w-20" />
        </div>

        {/* Body */}
        <div className="flex-1 flex flex-col items-center justify-center gap-8 p-8">
          {/* Icona centrale */}
          <motion.div
            animate={{ scale: isPaused ? [1, 1.02, 1] : [1, 1.04, 1] }}
            transition={{ repeat: Infinity, duration: isPaused ? 2 : 1.5, ease: 'easeInOut' }}
            className={clsx('w-24 h-24 rounded-full flex items-center justify-center', bgClass)}
          >
            {isPaused
              ? <Coffee size={40} style={{ color: '#ff851b' }} />
              : <Briefcase size={40} style={{ color: primaryColor }} />
            }
          </motion.div>

          {/* Cronometro */}
          <div className="text-center">
            <motion.p
              key={Math.floor(elapsed / 60)}
              initial={{ opacity: 0.5 }}
              animate={{ opacity: 1 }}
              className="text-7xl font-black tabular-nums tracking-tight leading-none"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {formatTime(elapsed)}
            </motion.p>
            <p className="text-xs text-[var(--text-muted)] font-bold mt-2 uppercase tracking-widest">
              Iniziato alle {checkInRef.current}
            </p>
          </div>

          {/* Stats row */}
          <div className="flex gap-6">
            <div className="text-center">
              <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-0.5">Tempo attivo</p>
              <p className="text-sm font-black">{formatHM(elapsed - pauseElapsed)}</p>
            </div>
            {pauseElapsed > 0 && (
              <div className="text-center">
                <p className="text-[9px] font-bold text-orange-400 uppercase tracking-wider mb-0.5">In pausa</p>
                <p className="text-sm font-black text-orange-500">{formatHM(pauseElapsed)}</p>
              </div>
            )}
            <div className="text-center">
              <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-0.5">Data</p>
              <p className="text-sm font-black">{format(new Date(), 'dd MMM')}</p>
            </div>
          </div>
        </div>

        {/* Footer controls */}
        <div className="px-8 pb-10 flex items-center justify-center gap-6 bg-[var(--bg-surface)] border-t border-[var(--border-subtle)] pt-6">
          <AnimatePresence mode="wait">
            {!isPaused ? (
              <motion.div
                key="running"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center gap-6"
              >
                <button
                  onClick={handlePause}
                  className="w-16 h-16 rounded-full border-2 border-orange-400 flex items-center justify-center text-orange-500 active:scale-90 transition-transform"
                >
                  <Pause size={24} />
                </button>
                <button
                  onClick={handleStop}
                  className="w-20 h-20 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white shadow-xl active:scale-90 transition-transform"
                  style={{ boxShadow: `0 8px 32px -8px color-mix(in srgb, var(--color-primary) 50%, transparent)` }}
                >
                  <Square size={28} fill="currentColor" />
                </button>
                <div className="w-16" />
              </motion.div>
            ) : (
              <motion.div
                key="paused"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center gap-4"
              >
                <button
                  onClick={handleStop}
                  className="px-6 py-3.5 rounded-2xl border-2 border-red-400 text-red-500 font-black text-sm flex items-center gap-2 active:scale-95 transition-transform"
                >
                  <Square size={16} fill="currentColor" />
                  Termina
                </button>
                <button
                  onClick={handleResume}
                  className="px-8 py-3.5 rounded-2xl bg-[var(--color-primary)] text-white font-black text-sm flex items-center gap-2 shadow-lg active:scale-95 transition-transform"
                >
                  <Play size={16} fill="currentColor" />
                  Riprendi
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <SaveModal
        isOpen={showSave}
        elapsed={elapsed}
        checkIn={checkInRef.current}
        onSave={handleSave}
        onCancel={() => {
          setShowSave(false)
          startTicking()
          setStatus('running')
        }}
      />
    </>,
    document.body
  )
}

export default WorkTimer
