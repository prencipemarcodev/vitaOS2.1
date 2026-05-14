import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, Unlock, Timer, Zap, MapPin, Activity } from 'lucide-react'
import { formatDuration, formatPace } from '@/lib/runCalculations'

function RunFocusMode({ tracker, onUnlock }) {
  const [isUnlocking, setIsUnlocking] = useState(false)
  const [unlockProgress, setUnlockProgress] = useState(0)
  const unlockTimerRef = useRef(null)

  const { elapsed, distanceKm, currentPace, currentSpeed } = tracker

  // Logica Long Press per sbloccare
  const startUnlocking = () => {
    setIsUnlocking(true)
    setUnlockProgress(0)
    const startTime = Date.now()
    const duration = 2000 // 2 secondi per sbloccare

    unlockTimerRef.current = setInterval(() => {
      const p = (Date.now() - startTime) / duration
      if (p >= 1) {
        clearInterval(unlockTimerRef.current)
        setUnlockProgress(1)
        onUnlock()
      } else {
        setUnlockProgress(p)
      }
    }, 50)
  }

  const stopUnlocking = () => {
    clearInterval(unlockTimerRef.current)
    setIsUnlocking(false)
    setUnlockProgress(0)
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-between py-12 px-6 select-none touch-none"
    >
      {/* Apple Music Player (Grayscale) */}
      <div className="w-full rounded-2xl overflow-hidden border border-white/10 bg-black shadow-2xl">
        <iframe 
          allow="autoplay *; encrypted-media *; fullscreen *; clipboard-write" 
          frameBorder="0" 
          height="175" 
          style={{ width: '100%', maxWidth: '100%', overflow: 'hidden', borderRadius: '10px', filter: 'grayscale(1) contrast(1.2) invert(1)' }} 
          sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation" 
          src="https://embed.music.apple.com/it/playlist/nostalgic-2019/pl.u-gxblgbxCbKWdlRg?theme=dark"
        />
      </div>

      {/* Main Stats (White on Black) */}
      <div className="flex-1 flex flex-col items-center justify-center space-y-12 w-full">
        <div className="text-center">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.3em] mb-2">Tempo Trascorso</p>
          <p className="text-7xl font-black text-white tabular-nums tracking-tighter">
            {formatDuration(elapsed)}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-x-12 gap-y-10 w-full max-w-xs">
          <div className="text-center">
            <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1">Distanza</p>
            <p className="text-3xl font-black text-white tabular-nums">{distanceKm.toFixed(2)} <span className="text-sm font-bold text-gray-400">km</span></p>
          </div>
          <div className="text-center">
            <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1">Velocità</p>
            <p className="text-3xl font-black text-white tabular-nums">{(currentSpeed * 3.6).toFixed(1)} <span className="text-sm font-bold text-gray-400">km/h</span></p>
          </div>
          <div className="text-center">
            <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1">Passo</p>
            <p className="text-3xl font-black text-white tabular-nums">{formatPace(currentPace)}</p>
          </div>
          <div className="text-center">
            <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1">Media</p>
            <p className="text-3xl font-black text-white tabular-nums">{(distanceKm > 0 ? (distanceKm / (elapsed/3600)).toFixed(1) : '0.0')} <span className="text-sm font-bold text-gray-400">km/h</span></p>
          </div>
        </div>
      </div>

      {/* Unlock Control */}
      <div className="relative flex flex-col items-center">
        <button
          onMouseDown={startUnlocking}
          onMouseUp={stopUnlocking}
          onMouseLeave={stopUnlocking}
          onTouchStart={startUnlocking}
          onTouchEnd={stopUnlocking}
          className={clsx(
            "relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300",
            isUnlocking ? "bg-white/10 scale-110" : "bg-white/5"
          )}
        >
          {/* Progress Circle */}
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <circle
              cx="40"
              cy="40"
              r="36"
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="4"
            />
            <motion.circle
              cx="40"
              cy="40"
              r="36"
              fill="none"
              stroke="white"
              strokeWidth="4"
              strokeDasharray="226.2"
              strokeDashoffset={226.2 * (1 - unlockProgress)}
              strokeLinecap="round"
            />
          </svg>
          
          <Lock size={28} className={clsx("text-white transition-opacity", isUnlocking ? "opacity-40" : "opacity-100")} />
        </button>
        <p className="mt-4 text-[9px] font-bold text-gray-600 uppercase tracking-widest">Tieni premuto per sbloccare</p>
      </div>

      {/* OLED Guard (Subtle motion to prevent burn-in over long periods) */}
      <motion.div 
        animate={{ x: [0, 1, 0, -1, 0], y: [0, -1, 0, 1, 0] }}
        transition={{ duration: 10, repeat: Infinity }}
        className="fixed inset-0 pointer-events-none border border-white/5"
      />
    </motion.div>
  )
}

import clsx from 'clsx'
export default RunFocusMode
