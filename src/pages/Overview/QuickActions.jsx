import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LogIn, LogOut, Clock, CalendarPlus } from 'lucide-react'
import Card from '@/components/ui/Card'

const ACTIONS = [
  { icon: LogIn,       label: 'Entrata',  color: 'var(--color-success)', path: '/firme',      action: 'checkin' },
  { icon: LogOut,      label: 'Uscita',   color: 'var(--color-danger)',  path: '/firme',      action: 'checkout' },
  { icon: Clock,       label: 'Timbra',   color: 'var(--color-primary)', path: '/firme',      action: 'stamp' },
  { icon: CalendarPlus,label: 'Evento',   color: 'var(--color-info)',    path: '/calendario', action: 'add' },
]

function QuickActions() {
  const navigate = useNavigate()

  return (
    <Card padding="sm" className="shrink-0">
      <p className="text-[10px] uppercase tracking-wider font-medium text-[var(--text-muted)] px-2 mb-2">
        Azioni rapide
      </p>
      <div className="grid grid-cols-4 gap-1.5">
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
