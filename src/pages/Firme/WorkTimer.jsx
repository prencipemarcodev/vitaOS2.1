import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Square, Pause, Play, ChevronLeft, Coffee, Briefcase } from 'lucide-react'
import { useFirmeStore } from '@/store/useFirmeStore'
import { useWorkSessionStore } from '@/store/useWorkSessionStore'
import { useAuthStore } from '@/store/useAuthStore'
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

function SaveModal({ isOpen, elapsed, checkIn, lunchBreakElapsed, onSave, onCancel }) {
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    await onSave(notes)
    setLoading(false)
  }

  if (!isOpen) return null
  const checkOut = format(new Date(), 'HH:mm')
  const totalSeconds = elapsed + lunchBreakElapsed

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
        <p className="text-xs text-[var(--text-muted)] mb-5 leading-normal">
          {checkIn} → {checkOut} · <span className="font-bold text-[var(--text-primary)]">{formatHM(totalSeconds)} Totali</span>
          {lunchBreakElapsed > 0 && (
            <>
              <br />
              <span className="text-emerald-500 font-extrabold">🍱 Pausa pranzo: {formatHM(lunchBreakElapsed)}</span>
              <br />
              <span className="text-[var(--text-primary)] font-extrabold">💼 Tempo netto lavorato: {formatHM(elapsed)}</span>
            </>
          )}
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
          <button onClick={onCancel} className="flex-1 py-3 rounded-2xl border border-[var(--border-subtle)] text-sm font-bold text-[var(--text-muted)]">
            Annulla
          </button>
          <button onClick={handleSave} disabled={loading} className="flex-1 py-3 rounded-2xl bg-[var(--color-primary)] text-white text-sm font-black shadow-lg disabled:opacity-60">
            {loading ? 'Salvo...' : 'Salva Sessione'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

function WorkTimer({ onClose }) {
  const { addSession } = useFirmeStore()
  const { user } = useAuthStore()
  const {
    isRunning, isPaused, checkIn, checkInDate,
    elapsed, pauseElapsed,
    isLunchBreak, lunchBreakElapsed,
    mode, pomoPhase, pomoSecondsLeft, completedPomodoros,
    pauseSession, resumeSession, tickElapsed, tickPause, stopSession,
    setMode, setPomoPhase, setPomoSecondsLeft, setCompletedPomodoros, tickPomo,
    startLunchBreak, resumeFromLunchBreak, tickLunchBreak,
  } = useWorkSessionStore()

  const [showSave, setShowSave] = useState(false)
  const timerRef = useRef(null)
  const pauseTimerRef = useRef(null)
  const lunchTimerRef = useRef(null)

  const startTicking = useCallback(() => {
    if (timerRef.current) return
    timerRef.current = setInterval(() => {
      tickElapsed()
      
      const currentStore = useWorkSessionStore.getState()
      if (currentStore.mode === 'pomodoro') {
        const prevPhase = currentStore.pomoPhase
        tickPomo()
        
        const nextStore = useWorkSessionStore.getState()
        if (nextStore.pomoPhase !== prevPhase) {
          // Fase cambiata!
          if (nextStore.pomoPhase === 'break') {
            toast.success("🍅 Pomodoro completato! Ora 5 minuti di pausa caffè.", { duration: 8000 })
            try {
              const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
              const osc = audioCtx.createOscillator()
              osc.type = 'sine'
              osc.frequency.setValueAtTime(880, audioCtx.currentTime) // La (A5)
              osc.connect(audioCtx.destination)
              osc.start()
              osc.stop(audioCtx.currentTime + 0.3)
            } catch (e) {}
          } else {
            toast.info("💼 Pausa terminata! Si ricomincia a lavorare.", { duration: 8000 })
            try {
              const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
              const osc = audioCtx.createOscillator()
              osc.type = 'sine'
              osc.frequency.setValueAtTime(660, audioCtx.currentTime) // Mi (E5)
              osc.connect(audioCtx.destination)
              osc.start()
              osc.stop(audioCtx.currentTime + 0.3)
            } catch (e) {}
          }
        }
      }
    }, 1000)
  }, [tickElapsed, tickPomo])

  const stopTicking = useCallback(() => {
    clearInterval(timerRef.current)
    timerRef.current = null
  }, [])

  const startPauseTicking = useCallback(() => {
    if (pauseTimerRef.current) return
    pauseTimerRef.current = setInterval(() => tickPause(), 1000)
  }, [tickPause])

  const stopPauseTicking = useCallback(() => {
    clearInterval(pauseTimerRef.current)
    pauseTimerRef.current = null
  }, [])

  const startLunchTicking = useCallback(() => {
    if (lunchTimerRef.current) return
    lunchTimerRef.current = setInterval(() => tickLunchBreak(), 1000)
  }, [tickLunchBreak])

  const stopLunchTicking = useCallback(() => {
    clearInterval(lunchTimerRef.current)
    lunchTimerRef.current = null
  }, [])

  useEffect(() => {
    if (isRunning && !isPaused) startTicking()
    if (isRunning && isPaused && !isLunchBreak) startPauseTicking()
    if (isRunning && isPaused && isLunchBreak) startLunchTicking()
    return () => { 
      stopTicking()
      stopPauseTicking()
      stopLunchTicking()
    }
  }, [isRunning, isPaused, isLunchBreak, startTicking, startPauseTicking, startLunchTicking, stopTicking, stopPauseTicking, stopLunchTicking])

  const handlePause = () => {
    pauseSession()
    stopTicking()
    startPauseTicking()
  }

  const handleResume = () => {
    resumeSession()
    stopPauseTicking()
    startTicking()
  }

  const handleLunchBreak = () => {
    startLunchBreak()
    stopTicking()
    stopPauseTicking()
    startLunchTicking()
  }

  const handleResumeFromLunch = () => {
    resumeFromLunchBreak()
    stopLunchTicking()
    startTicking()
  }

  const handleStop = () => {
    stopTicking()
    stopPauseTicking()
    stopLunchTicking()
    setShowSave(true)
  }

  const handleSave = async (notes) => {
    const checkOut = format(new Date(), 'HH:mm')
    const [h1, m1] = checkIn.split(':').map(Number)
    const [h2, m2] = checkOut.split(':').map(Number)
    const totalDuration = Math.max(1, (h2 * 60 + m2) - (h1 * 60 + m1))
    
    const lunchMinutes = Math.floor(lunchBreakElapsed / 60)
    const netDuration = Math.max(1, totalDuration - lunchMinutes)
    
    const lunchSuffix = lunchMinutes > 0 ? `\n[🍱 Pausa Pranzo: ${lunchMinutes} min]` : ''
    const noteSuffix = mode === 'pomodoro' ? `\n[🍅 Pomodoro completati: ${completedPomodoros}]` : ''
    const finalNotes = (notes || '').trim() + lunchSuffix + noteSuffix

    try {
      const { data, error } = await supabase
        .from('work_sessions')
        .insert({ 
          user_id: user?.id, 
          date: checkInDate, 
          check_in: checkIn, 
          check_out: checkOut, 
          duration_minutes: netDuration, 
          notes: finalNotes || null, 
          is_manual: false 
        })
        .select().single()
      if (error) throw error
      addSession(data)
      toast.success(`Sessione salvata — ${formatHM(elapsed)}`)
      stopSession()
      onClose()
    } catch (err) {
      toast.error('Errore nel salvataggio')
      console.error(err)
    }
  }

  const isPomo = mode === 'pomodoro'
  const isPomoBreak = isPomo && pomoPhase === 'break'
  
  const primaryColor = isLunchBreak
    ? '#10b981'
    : isPaused 
      ? '#ff851b' 
      : isPomoBreak 
        ? 'var(--color-success)' 
        : isPomo 
          ? '#ef4444' 
          : 'var(--color-primary)'
        
  const bgClass = isLunchBreak
    ? 'bg-emerald-50'
    : isPaused 
      ? 'bg-orange-50' 
      : isPomoBreak 
        ? 'bg-green-50' 
        : isPomo 
          ? 'bg-red-50' 
          : 'bg-[var(--color-primary-ghost)]'

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
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]">
          <button onClick={onClose} className="flex items-center gap-1 text-xs font-bold text-[var(--color-primary)]">
            <ChevronLeft size={16} />
            Indietro
          </button>
          
          <div className="flex items-center gap-2">
            <div className={clsx(
              'w-2 h-2 rounded-full', 
              isLunchBreak ? 'bg-emerald-500 animate-pulse' : isPaused ? 'bg-orange-500' : 'bg-green-500 animate-pulse'
            )} />
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
              {isLunchBreak 
                ? 'Pausa Pranzo'
                : isPaused 
                  ? 'In pausa' 
                  : isPomoBreak 
                    ? 'Pausa Caffè' 
                    : isPomo 
                      ? 'Lavoro Focalizzato' 
                      : 'Sessione attiva'
              }
            </span>
          </div>
          <div className="w-20" />
        </div>

        {/* Mode Switcher pill (only visible when session hasn't started) */}
        {!isRunning && (
          <div className="flex justify-center p-4 bg-[var(--bg-surface)] border-b border-[var(--border-subtle)]">
            <div className="bg-[var(--bg-base)] p-1 rounded-2xl border border-[var(--border-subtle)] flex gap-1 shadow-sm">
              <button
                type="button"
                onClick={() => setMode('standard')}
                className={clsx(
                  'px-5 py-2 rounded-xl text-xs font-bold transition-all duration-300',
                  mode === 'standard'
                    ? 'bg-[var(--color-primary)] text-white shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                )}
              >
                Timer Libero
              </button>
              <button
                type="button"
                onClick={() => setMode('pomodoro')}
                className={clsx(
                  'px-5 py-2 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-1.5',
                  mode === 'pomodoro'
                    ? 'bg-red-500 text-white shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                )}
              >
                🍅 Pomodoro
              </button>
            </div>
          </div>
        )}

        {/* Active Session Mode Label */}
        {isRunning && (
          <div className="flex justify-center pt-6">
            <span className={clsx(
              'text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border',
              isPomo 
                ? 'bg-red-500/10 border-red-500/20 text-red-500' 
                : 'bg-[var(--color-primary-ghost)] border-[var(--color-primary)]/10 text-[var(--color-primary)]'
            )}>
              {isPomo ? 'Modalità Pomodoro' : 'Modalità Timer Libero'}
            </span>
          </div>
        )}

        <div className="flex-1 flex flex-col items-center justify-center gap-8 p-8">
          <motion.div
            animate={{ scale: isPaused ? [1, 1.02, 1] : [1, 1.04, 1] }}
            transition={{ repeat: Infinity, duration: isPaused ? 2 : 1.5, ease: 'easeInOut' }}
            className={clsx('w-24 h-24 rounded-full flex items-center justify-center transition-colors duration-500', bgClass)}
          >
            {isLunchBreak
              ? <span className="text-4xl select-none">🍱</span>
              : isPaused
                ? <Coffee size={40} style={{ color: '#ff851b' }} />
                : isPomoBreak
                  ? <Coffee size={40} style={{ color: 'var(--color-success)' }} />
                  : isPomo
                    ? <span className="text-4xl select-none">🍅</span>
                    : <Briefcase size={40} style={{ color: primaryColor }} />
            }
          </motion.div>

          <div className="text-center">
            <motion.p
              key={isPomo ? pomoSecondsLeft : elapsed}
              initial={{ opacity: 0.8, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-7xl font-black tabular-nums tracking-tight leading-none text-[var(--text-primary)]"
            >
              {isPomo ? formatTime(pomoSecondsLeft) : formatTime(elapsed)}
            </motion.p>
            
            {isPomo && (
              <p className="text-sm font-extrabold text-red-500/80 mt-2 flex items-center justify-center gap-1.5">
                <span>🍅</span> completati in questa sessione: <span className="text-base font-black text-red-500">{completedPomodoros}</span>
              </p>
            )}
            
            {isRunning && (
              <p className="text-xs text-[var(--text-muted)] font-bold mt-3 uppercase tracking-widest">
                Iniziato alle {checkIn}
              </p>
            )}
          </div>

          <div className="flex gap-6">
            <div className="text-center">
              <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-0.5">Tempo attivo</p>
              <p className="text-sm font-black">{formatHM(elapsed)}</p>
            </div>
            {pauseElapsed > 0 && (
              <div className="text-center">
                <p className="text-[9px] font-bold text-orange-400 uppercase tracking-wider mb-0.5">In pausa</p>
                <p className="text-sm font-black text-orange-500">{formatHM(pauseElapsed)}</p>
              </div>
            )}
            {lunchBreakElapsed > 0 && (
              <div className="text-center">
                <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider mb-0.5">Pranzo</p>
                <p className="text-sm font-black text-emerald-500">{formatHM(lunchBreakElapsed)}</p>
              </div>
            )}
            <div className="text-center">
              <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-0.5">Data</p>
              <p className="text-sm font-black">{format(new Date(), 'dd MMM')}</p>
            </div>
          </div>
        </div>

        <div className="px-8 pb-10 flex items-center justify-center gap-6 bg-[var(--bg-surface)] border-t border-[var(--border-subtle)] pt-6">
          <AnimatePresence mode="wait">
            {!isRunning ? (
              // Se la sessione non è ancora partita, mostriamo il tasto Start!
              <motion.button
                key="start"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={() => {
                  const now = new Date()
                  const timeStr = format(now, 'HH:mm')
                  const dateStr = format(now, 'yyyy-MM-dd')
                  useWorkSessionStore.getState().startSession(timeStr, dateStr)
                }}
                className={clsx(
                  'px-12 py-4 rounded-3xl text-white font-black text-base shadow-xl active:scale-95 transition-all duration-300',
                  isPomo ? 'bg-red-500 hover:bg-red-600' : 'bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)]'
                )}
              >
                Inizia Sessione
              </motion.button>
            ) : !isPaused ? (
              <motion.div key="running" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="flex items-center gap-4">
                <button 
                  onClick={handlePause} 
                  className="w-16 h-16 rounded-full border-2 border-orange-400 flex flex-col items-center justify-center text-orange-500 active:scale-90 transition-transform"
                  title="Pausa Breve"
                >
                  <Pause size={20} />
                  <span className="text-[8px] font-black uppercase mt-0.5">Pausa</span>
                </button>
                <button
                  onClick={handleStop}
                  className="w-20 h-20 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white shadow-xl active:scale-90 transition-transform"
                  style={{ boxShadow: `0 8px 32px -8px color-mix(in srgb, var(--color-primary) 50%, transparent)` }}
                >
                  <Square size={28} fill="currentColor" />
                </button>
                <button 
                  onClick={handleLunchBreak} 
                  className="w-16 h-16 rounded-full border-2 border-emerald-400 flex flex-col items-center justify-center text-emerald-500 active:scale-90 transition-transform"
                  title="Pausa Pranzo"
                >
                  <Coffee size={20} />
                  <span className="text-[8px] font-black uppercase mt-0.5">Pranzo</span>
                </button>
              </motion.div>
            ) : (
              <motion.div key="paused" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="flex items-center gap-4">
                <button onClick={handleStop} className="px-6 py-3.5 rounded-2xl border-2 border-red-400 text-red-500 font-black text-sm flex items-center gap-2 active:scale-95 transition-transform">
                  <Square size={16} fill="currentColor" />
                  Termina
                </button>
                <button 
                  onClick={isLunchBreak ? handleResumeFromLunch : handleResume} 
                  className="px-8 py-3.5 rounded-2xl bg-[var(--color-primary)] text-white font-black text-sm flex items-center gap-2 shadow-lg active:scale-95 transition-transform"
                >
                  <Play size={16} fill="currentColor" />
                  {isLunchBreak ? 'Riprendi Lavoro' : 'Riprendi'}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <SaveModal
        isOpen={showSave}
        elapsed={elapsed}
        checkIn={checkIn}
        lunchBreakElapsed={lunchBreakElapsed}
        onSave={handleSave}
        onCancel={() => {
          setShowSave(false)
          if (isLunchBreak) {
            startLunchTicking()
          } else {
            startTicking()
            resumeSession()
          }
        }}
      />
    </>,
    document.body
  )
}

export default WorkTimer
