import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Square, Pause, Play, ChevronLeft, Coffee, Briefcase, Trash2, ChevronDown } from 'lucide-react'
import { useFirmeStore } from '@/store/useFirmeStore'
import { useWorkSessionStore } from '@/store/useWorkSessionStore'
import { useAuthStore } from '@/store/useAuthStore'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { toast } from 'sonner'
import clsx from 'clsx'

function formatHM(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

function SaveModal({ isOpen, elapsed, checkIn, lunchBreakElapsed, onSave, onCancel, onDiscard }) {
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  
  // Local states for custom check-in and check-out times
  const [editedCheckIn, setEditedCheckIn] = useState(checkIn || '09:00')
  const [editedCheckOut, setEditedCheckOut] = useState(format(new Date(), 'HH:mm'))

  // Reset values when modal opens
  useEffect(() => {
    if (isOpen) {
      setEditedCheckIn(checkIn || '09:00')
      setEditedCheckOut(format(new Date(), 'HH:mm'))
    }
  }, [isOpen, checkIn])

  const handleSave = async () => {
    setLoading(true)
    await onSave(notes, editedCheckIn, editedCheckOut)
    setLoading(false)
  }

  if (!isOpen) return null

  // Recalculate values dynamically based on edited start/end times
  const [h1, m1] = editedCheckIn.split(':').map(Number)
  const [h2, m2] = editedCheckOut.split(':').map(Number)
  
  let totalMinutes = (h2 * 60 + m2) - (h1 * 60 + m1)
  if (totalMinutes < 0) {
    totalMinutes += 24 * 60 // Handle overnight session
  }
  
  const lunchMinutes = Math.floor(lunchBreakElapsed / 60)
  const netMinutes = Math.max(0, totalMinutes - lunchMinutes)

  const formatMinsToHM = (mins) => {
    const h = Math.floor(mins / 60)
    const m = mins % 60
    if (h > 0) return `${h}h ${m}m`
    return `${m}m`
  }

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
        className="w-full max-w-sm bg-[var(--bg-surface)] rounded-[32px] p-5 sm:p-6 shadow-2xl border border-[var(--border-subtle)] text-center"
      >
        <h3 className="text-base font-black mb-1" style={{ fontFamily: 'var(--font-display)' }}>Termina sessione</h3>
        
        {/* Orari Regolabili — optimized spacing for perfect mobile layout */}
        <div className="grid grid-cols-2 gap-3 mb-4 mt-4">
          <div className="space-y-1.5 text-left">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Ora Inizio</label>
            <input
              type="time"
              value={editedCheckIn}
              onChange={e => setEditedCheckIn(e.target.value)}
              className="w-full text-center bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-2xl py-2.5 px-2 text-sm sm:text-base font-black text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-ghost)]"
              style={{
                WebkitAppearance: 'none',
                MozAppearance: 'none',
                minWidth: '0',
              }}
            />
          </div>
          <div className="space-y-1.5 text-left">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Ora Fine</label>
            <input
              type="time"
              value={editedCheckOut}
              onChange={e => setEditedCheckOut(e.target.value)}
              className="w-full text-center bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-2xl py-2.5 px-2 text-sm sm:text-base font-black text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-ghost)]"
              style={{
                WebkitAppearance: 'none',
                MozAppearance: 'none',
                minWidth: '0',
              }}
            />
          </div>
        </div>

        {/* Informazioni durata ricalcolate in tempo reale */}
        <p className="text-xs text-[var(--text-muted)] mb-5 leading-normal text-left">
          Durata totale: <span className="font-bold text-[var(--text-primary)]">{formatMinsToHM(totalMinutes)}</span>
          {lunchMinutes > 0 && (
            <>
              <br />
              <span className="text-emerald-500 font-extrabold">🍱 Pausa pranzo: {formatMinsToHM(lunchMinutes)}</span>
              <br />
              <span className="text-[var(--text-primary)] font-extrabold">💼 Tempo netto lavorato: {formatMinsToHM(netMinutes)}</span>
            </>
          )}
        </p>

        <div className="space-y-2 mb-5 text-left">
          <label className="text-xs font-bold text-[var(--text-secondary)]">Note (opzionale)</label>
          <textarea
            rows={3}
            placeholder="Es: Sviluppo feature X, riunione..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-2xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-ghost)]"
          />
        </div>

        {/* Vertical Stacking for perfectly dimensioned, unified font-black buttons */}
        <div className="space-y-2.5 mt-5">
          <button 
            onClick={handleSave} 
            disabled={loading} 
            className="w-full py-3.5 rounded-2xl bg-[var(--color-primary)] text-white text-sm font-black shadow-lg disabled:opacity-60 transition-transform active:scale-[0.97]"
          >
            {loading ? 'Salvo...' : 'Salva Sessione'}
          </button>
          
          <button 
            onClick={onCancel} 
            className="w-full py-3.5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)] text-sm font-black text-[var(--text-secondary)] transition-transform active:scale-[0.97]"
          >
            Annulla
          </button>
          
          <button 
            onClick={onDiscard} 
            className="w-full py-3.5 rounded-2xl border border-red-200 dark:border-red-950/30 bg-red-50/20 dark:bg-red-950/10 text-sm font-black text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-transform active:scale-[0.97] flex items-center justify-center gap-1.5"
          >
            <Trash2 size={14} />
            Elimina Sessione
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

function formatTime(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  if (h > 0) return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function WorkTimer({ onClose }) {
  const { addSession } = useFirmeStore()
  const { user } = useAuthStore()
  const {
    isRunning, isPaused, checkIn, checkInDate,
    elapsed, pauseElapsed,
    isLunchBreak, lunchBreakElapsed,
    mode, pomoPhase, pomoSecondsLeft, completedPomodoros,
    pauseSession, resumeSession, stopSession,
    setMode, setFullTimerOpen,
    startLunchBreak, resumeFromLunchBreak,
  } = useWorkSessionStore()

  const [showSave, setShowSave] = useState(false)
  const handleClose = () => {
    if (onClose) {
      onClose()
    } else {
      setFullTimerOpen(false)
    }
  }

  const handlePause = () => {
    pauseSession()
  }

  const handleResume = () => {
    resumeSession()
  }

  const handleLunchBreak = () => {
    startLunchBreak()
  }

  const handleResumeFromLunch = () => {
    resumeFromLunchBreak()
  }

  const handleStop = () => {
    setShowSave(true)
  }

  const handleSave = async (notes, finalCheckIn, finalCheckOut) => {
    const checkInToUse = finalCheckIn || checkIn
    const checkOutToUse = finalCheckOut || format(new Date(), 'HH:mm')
    const [h1, m1] = checkInToUse.split(':').map(Number)
    const [h2, m2] = checkOutToUse.split(':').map(Number)
    let totalDuration = (h2 * 60 + m2) - (h1 * 60 + m1)
    if (totalDuration < 0) {
      totalDuration += 24 * 60 // Handle overnight session
    }
    totalDuration = Math.max(1, totalDuration)
    
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
          check_in: checkInToUse, 
          check_out: checkOutToUse, 
          duration_minutes: netDuration, 
          notes: finalNotes || null, 
          is_manual: false 
        })
        .select().single()
      if (error) throw error
      addSession(data)
      
      const elapsedSeconds = netDuration * 60
      toast.success(`Sessione salvata — ${formatHM(elapsedSeconds)}`)
      stopSession()
      handleClose()
    } catch (err) {
      toast.error('Errore nel salvataggio')
      console.error(err)
    }
  }

  const handleDiscard = () => {
    stopSession()
    toast.info('Sessione eliminata')
    handleClose()
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
        className="fixed inset-0 z-[9999] bg-[var(--bg-base)] flex flex-col overflow-hidden"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {/* Subtle pulsing background glow orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <motion.div 
            animate={{ 
              scale: [1, 1.25, 1],
              opacity: [0.15, 0.28, 0.15],
              x: [0, 30, 0],
              y: [0, -40, 0]
            }}
            transition={{ repeat: Infinity, duration: 12, ease: "easeInOut" }}
            className="absolute -top-32 -left-32 w-[450px] h-[450px] rounded-full bg-[var(--color-primary)] blur-[120px]"
          />
          <motion.div 
            animate={{ 
              scale: [1, 1.35, 1],
              opacity: [0.12, 0.25, 0.12],
              x: [0, -50, 0],
              y: [0, 30, 0]
            }}
            transition={{ repeat: Infinity, duration: 15, ease: "easeInOut", delay: 2.5 }}
            className="absolute -bottom-32 -right-32 w-[450px] h-[450px] rounded-full bg-emerald-500 blur-[120px]"
          />
        </div>

        {/* Transparent custom header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)]/40 bg-[var(--bg-surface)]/80 backdrop-blur-md shrink-0 z-10">
          <button onClick={handleClose} className="flex items-center gap-1.5 text-xs font-black text-[var(--color-primary)] active:scale-95 transition-transform" title="Minimizza timer">
            <ChevronDown size={18} />
            Minimizza
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
          <div className="flex justify-center p-4 bg-[var(--bg-surface)] border-b border-[var(--border-subtle)] shrink-0 z-10">
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

        {/* Gorgeous, Organic, Premium Floating Card Layout */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-md mx-auto w-full overflow-y-auto z-10">
          <div className="w-full bg-white/80 dark:bg-black/60 border border-[var(--border-default)] rounded-[32px] p-8 shadow-2xl flex flex-col items-center justify-center gap-6 relative overflow-hidden backdrop-blur-xl">
            {/* Subtle glow orbs inside the card */}
            <div className="absolute -top-12 -left-12 w-32 h-32 rounded-full bg-[var(--color-primary)]/5 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-12 -right-12 w-32 h-32 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />

            {/* Active Mode Label inside card */}
            {isRunning && (
              <span className={clsx(
                'text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border shrink-0',
                isPomo 
                  ? 'bg-red-500/10 border-red-500/20 text-red-500' 
                  : 'bg-[var(--color-primary-ghost)] border-[var(--color-primary)]/10 text-[var(--color-primary)]'
              )}>
                {isPomo ? 'Modalità Pomodoro' : 'Modalità Timer Libero'}
              </span>
            )}

            {/* Custom Glowing suitcase circular status indicator */}
            <motion.div
              animate={{ scale: isPaused ? [1, 1.02, 1] : [1, 1.04, 1] }}
              transition={{ repeat: Infinity, duration: isPaused ? 2 : 1.5, ease: 'easeInOut' }}
              className={clsx(
                'w-20 h-20 rounded-full flex items-center justify-center transition-colors duration-500 border border-[var(--border-subtle)] shadow-inner shrink-0',
                bgClass
              )}
            >
              {isLunchBreak
                ? <span className="text-3xl select-none">🍱</span>
                : isPaused
                  ? <Coffee size={32} style={{ color: '#ff851b' }} />
                  : isPomoBreak
                    ? <Coffee size={32} style={{ color: 'var(--color-success)' }} />
                    : isPomo
                      ? <span className="text-3xl select-none">🍅</span>
                      : <Briefcase size={32} style={{ color: primaryColor }} />
              }
            </motion.div>

            {/* High-end Styled Timer Text (using clean font-body) */}
            <div className="text-center w-full">
              <motion.p
                key={isPomo ? pomoSecondsLeft : elapsed}
                initial={{ opacity: 0.8, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-6xl font-black tracking-tight leading-none text-[var(--text-primary)] tabular-nums"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                {isPomo ? formatTime(pomoSecondsLeft) : formatTime(elapsed)}
              </motion.p>
              
              {isPomo && (
                <p className="text-xs font-bold text-red-500/80 mt-2.5 flex items-center justify-center gap-1.5 leading-none">
                  <span>🍅</span> completati: <span className="text-sm font-black text-red-500">{completedPomodoros}</span>
                </p>
              )}
              
              {isRunning && (
                <p className="text-[10px] text-[var(--text-muted)] font-black mt-3.5 uppercase tracking-widest leading-none">
                  Iniziato alle {checkIn}
                </p>
              )}
            </div>

            {/* Micro details panel inside the floating card */}
            <div className="flex gap-6 justify-center w-full border-t border-[var(--border-subtle)]/60 pt-5 mt-2 shrink-0">
              <div className="text-center">
                <p className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-wider mb-0.5">Tempo attivo</p>
                <p className="text-xs font-black text-[var(--text-primary)]">{formatHM(elapsed)}</p>
              </div>
              {pauseElapsed > 0 && (
                <div className="text-center">
                  <p className="text-[8px] font-black text-orange-400 uppercase tracking-wider mb-0.5">In pausa</p>
                  <p className="text-xs font-black text-orange-500">{formatHM(pauseElapsed)}</p>
                </div>
              )}
              {lunchBreakElapsed > 0 && (
                <div className="text-center">
                  <p className="text-[8px] font-black text-emerald-400 uppercase tracking-wider mb-0.5">Pranzo</p>
                  <p className="text-xs font-black text-emerald-500">{formatHM(lunchBreakElapsed)}</p>
                </div>
              )}
              <div className="text-center">
                <p className="text-[8px] font-black text-[var(--text-muted)] uppercase tracking-wider mb-0.5">Data</p>
                <p className="text-xs font-black text-[var(--text-primary)]">{format(new Date(), 'dd MMM')}</p>
              </div>
            </div>

            {/* Unified Controls INSIDE the card for seamless, premium UX */}
            <div className="w-full pt-5 border-t border-[var(--border-subtle)]/60 flex flex-col items-center gap-4 shrink-0">
              <AnimatePresence mode="wait">
                {!isRunning ? (
                  <motion.button
                    key="start"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={() => {
                      const now = new Date()
                      const timeStr = format(now, 'HH:mm')
                      const dateStr = format(now, 'yyyy-MM-dd')
                      useWorkSessionStore.getState().startSession(timeStr, dateStr)
                    }}
                    className={clsx(
                      'px-12 py-4 rounded-full text-white font-black text-sm shadow-md active:scale-95 transition-all duration-300',
                      isPomo ? 'bg-red-500 hover:bg-red-600' : 'bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)]'
                    )}
                  >
                    Inizia Sessione
                  </motion.button>
                ) : (
                  <motion.div 
                    key="controls" 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0, y: 10 }} 
                    className="flex items-center justify-center gap-5 w-full"
                  >
                    {/* Left Button: Pause / Resume */}
                    {isLunchBreak ? (
                      <button 
                        disabled
                        className="w-14 h-14 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex flex-col items-center justify-center text-[var(--text-muted)] opacity-30 cursor-not-allowed"
                        title="Pausa"
                      >
                        <Pause size={18} />
                        <span className="text-[7px] font-black uppercase mt-0.5">Pausa</span>
                      </button>
                    ) : !isPaused ? (
                      <button 
                        onClick={handlePause} 
                        className="w-14 h-14 rounded-full bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/30 flex flex-col items-center justify-center text-orange-500 active:scale-[0.90] transition-all hover:bg-orange-100/30"
                        title="Metti in pausa"
                      >
                        <Pause size={18} />
                        <span className="text-[7px] font-black uppercase mt-0.5">Pausa</span>
                      </button>
                    ) : (
                      <button 
                        onClick={handleResume} 
                        className="w-14 h-14 rounded-full bg-[var(--color-primary-ghost)] border border-[var(--color-primary)]/20 flex flex-col items-center justify-center text-[var(--color-primary)] active:scale-[0.90] transition-all hover:bg-[var(--color-primary-ghost)]/80"
                        title="Riprendi lavoro"
                      >
                        <Play size={18} fill="currentColor" />
                        <span className="text-[7px] font-black uppercase mt-0.5">Riprendi</span>
                      </button>
                    )}

                    {/* Center Button: Stop */}
                    <button
                      onClick={handleStop}
                      className="w-18 h-18 rounded-full bg-red-500 hover:bg-red-600 flex flex-col items-center justify-center text-white shadow-lg active:scale-[0.90] transition-all"
                      style={{ width: '4.5rem', height: '4.5rem' }}
                      title="Termina sessione"
                    >
                      <Square size={20} fill="currentColor" />
                      <span className="text-[8px] font-black uppercase mt-0.5">Termina</span>
                    </button>

                    {/* Right Button: Lunch Break / Resume */}
                    {!isLunchBreak ? (
                      <button 
                        onClick={handleLunchBreak} 
                        disabled={isPaused}
                        className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 flex flex-col items-center justify-center text-emerald-600 active:scale-[0.90] transition-all hover:bg-emerald-100/30 disabled:opacity-40"
                        title="Pausa pranzo"
                      >
                        <span className="text-base select-none">🍱</span>
                        <span className="text-[7px] font-black uppercase mt-0.5">Pranzo</span>
                      </button>
                    ) : (
                      <button 
                        onClick={handleResumeFromLunch} 
                        className="w-14 h-14 rounded-full bg-[var(--color-primary-ghost)] border border-[var(--color-primary)]/20 flex flex-col items-center justify-center text-[var(--color-primary)] active:scale-[0.90] transition-all hover:bg-[var(--color-primary-ghost)]/80 animate-pulse"
                        title="Riprendi lavoro"
                      >
                        <Play size={18} fill="currentColor" />
                        <span className="text-[7px] font-black uppercase mt-0.5">Riprendi</span>
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.div>

      <SaveModal
        isOpen={showSave}
        elapsed={elapsed}
        checkIn={checkIn}
        lunchBreakElapsed={lunchBreakElapsed}
        onSave={handleSave}
        onCancel={() => setShowSave(false)}
        onDiscard={handleDiscard}
      />
    </>,
    document.body
  )
}

export default WorkTimer
