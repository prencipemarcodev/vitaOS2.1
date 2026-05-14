import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CalendarPlus, Clock, ArrowDownLeft, ArrowUpRight, StickyNote } from 'lucide-react'
import Card from '@/components/ui/Card'

const ACTIONS = [
  { icon: CalendarPlus, label: 'Evento',   color: '#4a90d9', path: '/calendario' },
  { icon: Clock,        label: 'Timbra',   color: 'var(--color-primary)', path: '/firme' },
  { icon: ArrowDownLeft,label: 'Spesa',    color: '#e05252', path: '/finanze' },
  { icon: ArrowUpRight, label: 'Entrata',  color: '#3d9970', path: '/finanze' },
  { icon: StickyNote,   label: 'Nota',     color: '#ff851b', path: '/note' },
]

function QuickActions() {
  const navigate = useNavigate()

  return (
    <Card padding="sm" className="shrink-0">
      <p className="text-[10px] uppercase tracking-wider font-medium text-[var(--text-muted)] px-2 mb-2">
        Azioni rapide
      </p>
      <div className="grid grid-cols-5 gap-1.5">
        {ACTIONS.map((a, i) => (
          <motion.button
            key={a.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 + i * 0.04 }}
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
  )
}

export default QuickActions
