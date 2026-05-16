import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { CalendarPlus, Clock, ArrowDownLeft, ArrowUpRight, StickyNote, Square } from 'lucide-react'
import Card from '@/components/ui/Card'
import { useWorkSessionStore } from '@/store/useWorkSessionStore'
import WorkTimer from '@/pages/Firme/WorkTimer'
import { format } from 'date-fns'

const OTHER_ACTIONS = [
  { icon: CalendarPlus,  label: 'Evento',  color: '#4a90d9', path: '/calendario' },
  { icon: ArrowDownLeft, label: 'Spesa',   color: '#e05252', path: '/finanze' },
  { icon: ArrowUpRight,  label: 'Entrata', color: '#3d9970', path: '/finanze' },
  { icon: StickyNote,    label: 'Nota',    color: '#ff851b', path: '/note' },
]

function QuickActions() {
  const navigate = useNavigate()
  const { isRunning, startSession } = useWorkSessionStore()
  const [timerOpen, setTimerOpen] = useState(false)

  const handleTimbraClick = () => {
    if (!isRunning) {
      startSession(format(new Date(), 'HH:mm'), format(new Date(), 'yyyy-MM-dd'))
    }
    setTimerOpen(true)
  }

  return (
    <>
      <Card padding="sm" className="shrink-0">
        <p className="text-[10px] uppercase tracking-wider font-medium text-[var(--text-muted)] px-2 mb-2">
          Azioni rapide
        </p>
        <div className="grid grid-cols-5 gap-1.5">

          {/* ── Timbra / Sessione attiva ── */}
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.19 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            onClick={handleTimbraClick}
            className="relative flex flex-col items-center gap-1.5 py-2.5 rounded-[var(--radius-md)] overflow-hidden transition-colors"
            style={isRunning ? {} : {
              background: 'var(--bg-elevated)',
              border: '1px solid transparent',
            }}
          >
            {/* Sfondo shimmer rosso quando sessione attiva */}
            {isRunning && (
              <>
                <motion.div
                  className="absolute inset-0 rounded-[var(--radius-md)]"
                  animate={{ opacity: [0.12, 0.22, 0.12] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ background: 'linear-gradient(135deg, #e05252, #ff6b6b)' }}
                />
                {/* Shimmer sweep */}
                <motion.div
                  className="absolute inset-0 rounded-[var(--radius-md)]"
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', repeatDelay: 0.5 }}
                  style={{
                    background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.25) 50%, transparent 100%)',
                    width: '60%',
                  }}
                />
              </>
            )}

            <div className="relative flex flex-col items-center gap-1.5">
              {isRunning
                ? <Square size={18} className="fill-red-500 text-red-500" />
                : <Clock size={18} style={{ color: 'var(--color-primary)' }} />
              }
              <span className={`text-[11px] font-bold ${isRunning ? 'text-red-500' : 'text-[var(--text-secondary)]'}`}>
                {isRunning ? 'Esci' : 'Timbra'}
              </span>
            </div>
          </motion.button>

          {/* ── Altri bottoni ── */}
          {OTHER_ACTIONS.map((a, i) => (
            <motion.button
              key={a.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 + (i + 1) * 0.04 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate(a.path)}
              className="flex flex-col items-center gap-1.5 py-2.5 rounded-[var(--radius-md)]
                bg-[var(--bg-elevated)] hover:bg-[var(--bg-hover)]
                text-[var(--text-secondary)] hover:text-[var(--text-primary)]
                transition-colors border border-transparent hover:border-[var(--border-subtle)]"
            >
              <a.icon size={18} style={{ color: a.color }} />
              <span className="text-[11px] font-medium">{a.label}</span>
            </motion.button>
          ))}
        </div>
      </Card>

      <AnimatePresence>
        {timerOpen && (
          <WorkTimer onClose={() => setTimerOpen(false)} />
        )}
      </AnimatePresence>
    </>
  )
}

export default QuickActions
