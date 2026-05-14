import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Play, Pause, Square, AlertCircle, MapPin, 
  ChevronLeft, Navigation, Info, Zap, Satellite
} from 'lucide-react'
import { useRunTracker } from '@/hooks/useRunTracker'
import { formatPace, formatDuration, calcAvgSpeed } from '@/lib/runCalculations'
import RunMap from './RunMap'
import RunFocusMode from './RunFocusMode'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import clsx from 'clsx'

const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream

function RunTrackingScreen({ onFinish, onCancel }) {
  const tracker = useRunTracker()
  const { 
    status, error, elapsed, distanceKm, 
    currentPace, currentSpeed, calories, elevationGain,
    polyline, splits, permissionStatus, accuracy,
    start, pause, resume, finish, reset, requestPermission, forceStart
  } = tracker

  const [countdown, setCountdown] = useState(null)
  const [isFocusMode, setIsFocusMode] = useState(false)

  // Auto-start if permission granted
  useEffect(() => {
    if (permissionStatus === 'granted' && status === 'idle' && countdown === null) {
      start()
    }
  }, [permissionStatus, status])

  // Countdown logic
  useEffect(() => {
    if (countdown === null) return
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(t)
    } else {
      forceStart() // Avvia realmente il tracking dopo il countdown
      setCountdown(null)
    }
  }, [countdown])

  const handleStartRequest = async () => {
    const ok = await requestPermission()
    if (ok) {
      start() // Va in waiting_gps
    }
  }

  const handleManualStart = () => {
    setCountdown(3)
  }

  // --- SCHERMATA 1: RICHIESTA PERMESSO ---
  if (status === 'idle' && permissionStatus !== 'granted' && countdown === null) {
    return (
      <div className="fixed inset-0 z-[200] bg-[var(--bg-base)] flex flex-col">
        <header className="h-[var(--header-height)] px-4 flex items-center justify-between border-b border-[var(--border-subtle)] bg-white shrink-0">
          <button onClick={onCancel} className="flex items-center gap-1 text-xs font-bold text-[var(--color-primary)]">
            <ChevronLeft size={16} />
            Torna a Salute
          </button>
          <h1 className="text-sm font-bold tracking-tight">Nuova corsa</h1>
          <div className="w-24" />
        </header>

        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-24 h-24 rounded-full bg-[var(--color-primary-ghost)] flex items-center justify-center text-[var(--color-primary)] mb-8">
            <Navigation size={40} className="rotate-45" />
          </div>
          
          <h2 className="text-2xl font-black mb-4">Accesso posizione</h2>
          <p className="text-sm text-[var(--text-muted)] max-w-xs mb-10 leading-relaxed">
            VitaOS ha bisogno del GPS per registrare il percorso e i dati della corsa.
          </p>

          <div className="w-full space-y-3 max-w-xs">
            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-700 text-[10px] font-bold mb-2">
                <AlertCircle size={14} className="shrink-0" />
                {error}
              </div>
            )}
            
            <button 
              onClick={handleStartRequest}
              className={clsx(
                "w-full py-4 rounded-2xl font-black shadow-lg active:scale-95 transition-all",
                permissionStatus === 'denied' 
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed" 
                  : "bg-[var(--color-primary)] text-white shadow-[var(--color-primary-ghost)]"
              )}
              disabled={permissionStatus === 'denied'}
            >
              {permissionStatus === 'denied' ? 'GPS Disabilitato' : 'Consenti accesso GPS'}
            </button>
            <button 
              onClick={onCancel}
              className="w-full py-4 bg-[var(--bg-elevated)] text-[var(--text-muted)] rounded-2xl font-bold active:scale-95 transition-all"
            >
              Non adesso
            </button>
          </div>
        </div>
      </div>
    )
  }

  // --- COUNTDOWN ---
  if (countdown !== null) {
    return (
      <div className="fixed inset-0 z-[300] bg-[var(--color-primary)] flex items-center justify-center">
        <motion.span 
          key={countdown}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1.5, opacity: 1 }}
          exit={{ scale: 2, opacity: 0 }}
          className="text-9xl font-black text-white"
        >
          {countdown === 0 ? 'GO!' : countdown}
        </motion.span>
      </div>
    )
  }

  // --- SCHERMATA 2: ATTESA SEGNALE ---
  if (status === 'waiting_gps' || (status === 'idle' && permissionStatus === 'granted')) {
    return (
      <div className="fixed inset-0 z-[200] bg-[var(--bg-base)] flex flex-col">
        <header className="h-[var(--header-height)] px-4 flex items-center justify-between border-b border-[var(--border-subtle)] bg-white shrink-0">
          <button onClick={onCancel} className="flex items-center gap-1 text-xs font-bold text-[var(--color-primary)]">
            <ChevronLeft size={16} />
            Torna a Salute
          </button>
          <h1 className="text-sm font-bold tracking-tight">Acquisendo segnale</h1>
          <div className="w-24" />
        </header>

        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="relative w-32 h-32 mb-8">
            <div className="absolute inset-0 border-4 border-[var(--border-subtle)] rounded-full" />
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
              className={clsx(
                "absolute inset-0 border-4 rounded-full",
                (accuracy && accuracy < 15) ? "border-t-green-500" : "border-t-[var(--color-primary)]"
              )}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                animate={{ 
                  rotate: [0, -10, 10, -10, 0],
                  y: [0, -5, 0, -5, 0]
                }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                className={clsx(
                  "transition-colors duration-500",
                  (accuracy && accuracy < 15) ? "text-green-500" : "text-[var(--color-primary)]"
                )}
              >
                <Satellite size={40} />
              </motion.div>
            </div>
          </div>

          <h2 className="text-xl font-black mb-2">Acquisendo segnale...</h2>
          <p className="text-xs text-[var(--text-muted)] mb-10">Vai all'aperto per una migliore ricezione GPS</p>

          <Card padding="md" className="w-full max-w-xs grid grid-cols-3 gap-2">
            <div className="text-center border-r border-[var(--border-subtle)]">
              <p className="text-[8px] font-bold text-[var(--text-muted)] uppercase mb-1">Precisione</p>
              <p className={clsx("text-xs font-black", (accuracy && accuracy <= 15) ? "text-green-500" : "text-orange-500")}>
                ±{Math.round(accuracy || 0)}m
              </p>
            </div>
            <div className="text-center border-r border-[var(--border-subtle)]">
              <p className="text-[8px] font-bold text-[var(--text-muted)] uppercase mb-1">Satelliti</p>
              <p className={clsx("text-xs font-black", (accuracy && accuracy < 15) ? "text-green-500" : "text-orange-500")}>
                {accuracy ? (accuracy < 15 ? 'Ottimo' : 'Fixing...') : '...'}
              </p>
            </div>
            <div className="text-center">
              <p className="text-[8px] font-bold text-[var(--text-muted)] uppercase mb-1">Stato</p>
              <div className="flex items-center justify-center gap-1">
                <div className={clsx("w-1.5 h-1.5 rounded-full animate-pulse", (accuracy && accuracy < 15) ? "bg-green-500" : "bg-orange-400")} />
                <span className="text-[10px] font-bold uppercase">{(accuracy && accuracy < 15) ? 'Pronto' : 'FIX...'}</span>
              </div>
            </div>
          </Card>

          {/* Warning se precisione scarsa */}
          {accuracy > 15 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 bg-orange-50 border border-orange-100 rounded-2xl flex gap-3 text-left max-w-xs"
            >
              <AlertCircle size={18} className="text-orange-500 shrink-0" />
              <p className="text-[10px] text-orange-800 leading-normal">
                Segnale GPS debole. Se inizi ora, la precisione del percorso e del passo potrebbe non essere accurata.
              </p>
            </motion.div>
          )}

          <div className="mt-10 w-full max-w-xs">
            <button 
              onClick={handleManualStart}
              className={clsx(
                "w-full py-4 rounded-2xl font-black shadow-lg transition-all active:scale-95",
                accuracy <= 15 
                  ? "bg-[var(--color-primary)] text-white shadow-[var(--color-primary-ghost)]" 
                  : "bg-white border-2 border-[var(--color-primary)] text-[var(--color-primary)] shadow-sm"
              )}
            >
              Inizia Corsa
            </button>
          </div>

          {isIOS && (
            <div className="mt-8 p-4 bg-[var(--bg-elevated)] rounded-2xl flex gap-3 text-left max-w-xs opacity-60">
              <Info size={16} className="text-[var(--text-muted)] shrink-0" />
              <p className="text-[9px] text-[var(--text-muted)] leading-normal">
                Su iOS tieni lo schermo acceso durante tutta la corsa per non interrompere il tracking.
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }

  // --- SCHERMATA 3 & 4: RUNNING & PAUSED ---
  return (
    <div className="fixed inset-0 z-50 bg-[var(--bg-base)] flex flex-col">
      {/* Header Status */}
      <header className="px-6 py-4 flex items-center justify-between bg-white border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2">
          <div className={clsx("w-2 h-2 rounded-full", status === 'running' ? "bg-green-500 animate-pulse" : "bg-gray-400")} />
          <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
            {status === 'running' ? 'GPS Attivo' : 'In pausa'}
          </span>
        </div>
        <div className="text-xl font-black tabular-nums">
          {formatDuration(elapsed)}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
        <AnimatePresence mode="wait">
          {status === 'running' ? (
            <motion.div 
              key="running"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              <Card padding="lg" className="text-center">
                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1">Distanza</p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-5xl font-black tabular-nums">{distanceKm.toFixed(2)}</span>
                  <span className="text-lg font-bold text-[var(--text-muted)]">km</span>
                </div>
              </Card>

              <div className="grid grid-cols-2 gap-4">
                <Card padding="md">
                  <p className="text-[8px] font-bold text-[var(--text-muted)] uppercase mb-1">Passo</p>
                  <p className="text-xl font-black tabular-nums">{formatPace(currentPace)} <span className="text-xs font-bold text-[var(--text-muted)]">/km</span></p>
                </Card>
                <Card padding="md">
                  <p className="text-[8px] font-bold text-[var(--text-muted)] uppercase mb-1">Velocità</p>
                  <p className="text-xl font-black tabular-nums">{calcAvgSpeed(distanceKm, elapsed)} <span className="text-xs font-bold text-[var(--text-muted)]">km/h</span></p>
                </Card>
                <Card padding="md">
                  <p className="text-[8px] font-bold text-[var(--text-muted)] uppercase mb-1">Calorie</p>
                  <p className="text-xl font-black tabular-nums text-orange-500">{calories} <span className="text-xs font-bold text-[var(--text-muted)]">kcal</span></p>
                </Card>
                <Card padding="md">
                  <p className="text-[8px] font-bold text-[var(--text-muted)] uppercase mb-1">Dislivello</p>
                  <p className="text-xl font-black tabular-nums text-green-600">+{elevationGain} <span className="text-xs font-bold text-[var(--text-muted)]">m</span></p>
                </Card>
              </div>

              <div className="h-64 rounded-3xl overflow-hidden border border-[var(--border-subtle)] shadow-sm">
                <RunMap polyline={polyline} isLive={true} height={256} />
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="paused"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="flex flex-col items-center py-12"
            >
              <h2 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-[0.2em] mb-4">Corsa in pausa</h2>
              <p className="text-6xl font-black mb-12">{distanceKm.toFixed(2)} <span className="text-2xl">km</span></p>

              {/* Splits List with visual bars */}
              <div className="w-full max-w-xs space-y-4">
                <div className="flex items-center justify-between px-2 text-[10px] font-bold text-[var(--text-muted)] uppercase">
                  <span>Km</span>
                  <span>Pace</span>
                </div>
                {splits.slice(-3).map((s, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <span className="text-xs font-bold w-8 text-[var(--text-muted)]">{s.km} km</span>
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (300/s.pace_sec) * 100)}%` }}
                        className="h-full bg-orange-400"
                      />
                    </div>
                    <span className="text-xs font-black tabular-nums">{formatPace(s.pace_sec)}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Controls Footer */}
      <footer className="p-8 bg-white border-t border-[var(--border-subtle)] flex items-center justify-center gap-6">
        {status === 'running' ? (
          <>
            <button 
              onClick={() => setIsFocusMode(true)}
              className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-[var(--text-muted)] active:scale-90 transition-transform"
              title="Focus Mode"
            >
              <Activity size={20} />
            </button>
            <button 
              onClick={pause}
              className="w-16 h-16 rounded-full border-2 border-orange-500 flex items-center justify-center text-orange-500 active:scale-90 transition-transform"
            >
              <Pause size={24} />
            </button>
            <button 
              onClick={() => { pause(); }} // Stop logic triggers confirmation if needed, here we go direct for now
              className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center text-white shadow-lg shadow-red-100 active:scale-90 transition-transform"
            >
              <Square size={24} />
            </button>
          </>
        ) : (
          <>
            <button 
              onClick={resume}
              className="px-8 py-4 bg-orange-500 text-white rounded-2xl font-black flex items-center gap-2 shadow-lg shadow-orange-100 active:scale-95 transition-transform"
            >
              <Play size={20} fill="currentColor" />
              Riprendi
            </button>
            <button 
              onClick={() => onFinish(tracker)}
              className="px-8 py-4 bg-white border-2 border-red-500 text-red-500 rounded-2xl font-black flex items-center gap-2 active:scale-95 transition-transform"
            >
              <Zap size={20} />
              Termina
            </button>
          </>
        )}
      </footer>

      {/* Focus Mode Overlay */}
      <AnimatePresence>
        {isFocusMode && (
          <RunFocusMode 
            tracker={tracker} 
            onUnlock={() => setIsFocusMode(false)} 
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default RunTrackingScreen
