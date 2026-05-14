import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, Square, AlertCircle, MapPin } from 'lucide-react'
import { useRunTracker } from '@/hooks/useRunTracker'
import { formatPace, formatDuration } from '@/lib/runCalculations'
import RunMap from './RunMap'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'

function RunTrackingScreen({ onFinish, onCancel }) {
  const tracker = useRunTracker()
  const { 
    status, error, elapsed, distanceKm, 
    currentPace, calories, polyline,
    start, pause, resume, finish 
  } = tracker

  // Avvio automatico al mount se in attesa
  if (status === 'idle') {
    start()
  }

  const handleFinish = () => {
    finish()
    onFinish(tracker)
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 bg-[var(--bg-base)] flex flex-col p-4 md:p-6"
    >
      {/* Header Statistiche */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="flex flex-col items-center justify-center p-6 bg-[var(--bg-elevated)] rounded-3xl border border-[var(--border-subtle)]">
          <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1">Distanza (KM)</p>
          <p className="text-4xl font-black text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
            {distanceKm.toFixed(2)}
          </p>
        </div>
        <div className="flex flex-col items-center justify-center p-6 bg-[var(--bg-elevated)] rounded-3xl border border-[var(--border-subtle)]">
          <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-1">Passo Ist.</p>
          <p className="text-4xl font-black text-[var(--color-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
            {formatPace(currentPace)}
          </p>
        </div>
      </div>

      {/* Main Counter */}
      <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
        <div className="relative">
          <motion.p 
            animate={{ scale: status === 'running' ? [1, 1.02, 1] : 1 }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="text-7xl font-black text-[var(--text-primary)] leading-none mb-2"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {formatDuration(elapsed)}
          </motion.p>
          {status === 'waiting_gps' && (
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1 bg-[var(--color-warning-ghost)] text-[var(--color-warning)] rounded-full border border-[var(--color-warning)] animate-pulse">
              <MapPin size={12} />
              <span className="text-[10px] font-bold uppercase">Acquisizione GPS...</span>
            </div>
          )}
        </div>
        
        <div className="flex gap-8 mt-4 text-[var(--text-muted)]">
          <div className="text-center">
            <p className="text-[10px] font-bold uppercase mb-0.5">Calorie</p>
            <p className="text-xl font-bold text-[var(--text-primary)]">{calories} <span className="text-xs font-medium">kcal</span></p>
          </div>
        </div>
      </div>

      {/* Mappa Mini */}
      <div className="h-48 mb-6 relative group">
        <RunMap polyline={polyline} isLive={true} height={192} />
        <div className="absolute top-3 left-3 bg-[var(--bg-base)]/80 backdrop-blur-sm px-2 py-1 rounded-md border border-[var(--border-subtle)] text-[8px] font-bold uppercase pointer-events-none">
          Live Track
        </div>
      </div>

      {/* Alert Errori */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-600 text-xs">
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}

      {/* Controlli */}
      <div className="flex items-center justify-center gap-6 pb-4">
        {status === 'paused' && (
          <Button 
            variant="danger" 
            size="lg" 
            icon={Square} 
            className="w-16 h-16 !rounded-full !p-0 shadow-lg" 
            onClick={handleFinish}
          />
        )}
        
        <Button 
          variant={status === 'paused' ? 'primary' : 'secondary'}
          size="lg"
          icon={status === 'paused' ? Play : Pause}
          className="w-20 h-20 !rounded-full !p-0 shadow-xl border-4 border-white"
          onClick={status === 'paused' ? resume : pause}
        />

        {status === 'paused' ? (
          <button 
            onClick={onCancel}
            className="text-[11px] font-bold text-[var(--text-muted)] uppercase hover:text-[var(--text-primary)] transition-colors"
          >
            Annulla
          </button>
        ) : (
          <div className="w-16" /> // spacer per centrare il play/pause
        )}
      </div>
    </motion.div>
  )
}

export default RunTrackingScreen
