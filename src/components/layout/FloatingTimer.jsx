import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, Square, Maximize2, ChevronRight, Briefcase } from 'lucide-react'
import { useWorkSessionStore } from '@/store/useWorkSessionStore'
import clsx from 'clsx'

// Formattazione tempo identica al timer principale
function formatTime(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  if (h > 0) return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function FloatingTimer() {
  // Granular store selections for high reactivity and no lag
  const isRunning = useWorkSessionStore(state => state.isRunning)
  const isPaused = useWorkSessionStore(state => state.isPaused)
  const isLunchBreak = useWorkSessionStore(state => state.isLunchBreak)
  const elapsed = useWorkSessionStore(state => state.elapsed)
  const mode = useWorkSessionStore(state => state.mode)
  const pomoPhase = useWorkSessionStore(state => state.pomoPhase)
  const pomoSecondsLeft = useWorkSessionStore(state => state.pomoSecondsLeft)

  const setFullTimerOpen = useWorkSessionStore(state => state.setFullTimerOpen)
  const pauseSession = useWorkSessionStore(state => state.pauseSession)
  const resumeSession = useWorkSessionStore(state => state.resumeSession)
  const startLunchBreak = useWorkSessionStore(state => state.startLunchBreak)
  const resumeFromLunchBreak = useWorkSessionStore(state => state.resumeFromLunchBreak)
  
  const [isExpanded, setIsExpanded] = useState(false)

  if (!isRunning) return null

  // Sincronizzazione istantanea calcolando la stringa direttamente inline
  const timeStr = mode === 'pomodoro' ? formatTime(pomoSecondsLeft) : formatTime(elapsed)

  // Stili cromatici coordinati
  const statusColorClass = isLunchBreak 
    ? 'bg-emerald-500' 
    : isPaused 
      ? 'bg-orange-500' 
      : mode === 'pomodoro' && pomoPhase === 'break'
        ? 'bg-green-500'
        : mode === 'pomodoro'
          ? 'bg-red-500'
          : 'bg-green-500'

  return (
    <div className="fixed right-0 top-1/2 -translate-y-1/2 z-[9990] flex items-center justify-end pointer-events-none">
      <AnimatePresence mode="wait">
        {!isExpanded ? (
          /* ── A. LINGUETTA MINIMIZZATA ── */
          <motion.button
            key="handle"
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 50, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 450, damping: 30 }}
            onClick={() => setIsExpanded(true)}
            className="pointer-events-auto flex items-center gap-2 pl-3.5 pr-2.5 py-2.5 rounded-l-full bg-white/80 dark:bg-black/80 backdrop-blur-md border-l border-y border-[var(--border-subtle)] shadow-lg hover:pl-4 transition-all group"
          >
            <span className={clsx("w-2 h-2 rounded-full animate-pulse", statusColorClass)} />
            <span 
              className="text-xs font-black tracking-tight text-[var(--text-primary)] tabular-nums"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              {timeStr}
            </span>
            <div className="w-6 h-6 rounded-full bg-[var(--color-primary-ghost)] flex items-center justify-center text-[var(--color-primary)] group-hover:scale-110 transition-transform">
              {isLunchBreak ? '🍱' : <Briefcase size={12} />}
            </div>
          </motion.button>
        ) : (
          /* ── B. BOLLA DI CONTROLLO ESPANSA ── */
          <motion.div
            key="bubble"
            initial={{ scale: 0.9, opacity: 0, x: 20 }}
            animate={{ scale: 1, opacity: 1, x: -16 }}
            exit={{ scale: 0.9, opacity: 0, x: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="pointer-events-auto w-64 bg-white/90 dark:bg-black/90 backdrop-blur-xl border border-[var(--border-subtle)] rounded-3xl p-4 shadow-[0_16px_48px_-12px_rgba(0,0,0,0.18)] flex flex-col gap-4"
          >
            {/* Header della Bolla */}
            <div className="flex items-center justify-between pb-1 border-b border-[var(--border-subtle)]">
              <div className="flex items-center gap-1.5">
                <span className={clsx("w-2 h-2 rounded-full", statusColorClass)} />
                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                  {isLunchBreak ? 'Pausa Pranzo' : isPaused ? 'In Pausa' : 'Sessione Attiva'}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setFullTimerOpen(true)}
                  className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                  title="Espandi a schermo intero"
                >
                  <Maximize2 size={13} />
                </button>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="p-1.5 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                  title="Minimizza"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>

            {/* Timer Principale */}
            <div className="text-center py-2">
              <p 
                className="text-4xl font-black tracking-tight text-[var(--text-primary)] tabular-nums"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                {timeStr}
              </p>
              {mode === 'pomodoro' && (
                <p className="text-[10px] text-red-500 font-extrabold mt-1">
                  🍅 Pomodoro Mode
                </p>
              )}
            </div>

            {/* Controlli Rapidi */}
            <div className="flex items-center justify-center gap-3.5 pt-1">
              {/* Pausa / Riprendi */}
              {!isPaused ? (
                <button
                  onClick={pauseSession}
                  className="w-10 h-10 rounded-full border border-orange-300 text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/20 flex items-center justify-center transition-colors"
                  title="Metti in pausa"
                >
                  <Pause size={14} />
                </button>
              ) : (
                <button
                  onClick={isLunchBreak ? resumeFromLunchBreak : resumeSession}
                  className="w-10 h-10 rounded-full bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)] flex items-center justify-center shadow-md transition-colors"
                  title="Riprendi"
                >
                  <Play size={14} fill="currentColor" />
                </button>
              )}

              {/* Stop / Termina */}
              <button
                onClick={() => setFullTimerOpen(true)} // Rimandiamo a schermo intero per mostrare la modale di salvataggio note
                className="w-12 h-12 rounded-full bg-red-500 text-white hover:bg-red-600 flex items-center justify-center shadow-lg hover:shadow-red-500/20 transition-all active:scale-95"
                title="Termina sessione"
              >
                <Square size={16} fill="currentColor" />
              </button>

              {/* Pranzo / Riprendi */}
              {!isLunchBreak ? (
                <button
                  onClick={startLunchBreak}
                  disabled={isPaused && !isLunchBreak}
                  className="w-10 h-10 rounded-full border border-emerald-300 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 flex items-center justify-center transition-colors disabled:opacity-40"
                  title="Pausa pranzo"
                >
                  <span>🍱</span>
                </button>
              ) : (
                <div className="w-10 h-10 flex items-center justify-center text-emerald-500 animate-pulse text-sm">
                  🍱
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

