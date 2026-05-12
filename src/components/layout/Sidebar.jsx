import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Calendar, FileSignature, Wallet,
  PiggyBank, Heart, StickyNote, Settings, ChevronLeft, ChevronRight,
} from 'lucide-react'
import clsx from 'clsx'

const NAV_ITEMS = [
  { to: '/',             icon: LayoutDashboard, label: 'Overview',      id: '1' },
  { to: '/calendario',   icon: Calendar,        label: 'Calendario',    id: '2' },
  { to: '/firme',        icon: FileSignature,   label: 'Firme',         id: '3' },
  { to: '/finanze',      icon: Wallet,          label: 'Finanze',       id: '4' },
  { to: '/risparmi',     icon: PiggyBank,       label: 'Risparmi',      id: '5' },
  { to: '/salute',       icon: Heart,           label: 'Salute',        id: '6' },
  { to: '/note',         icon: StickyNote,      label: 'Note',          id: '7' },
  { to: '/impostazioni', icon: Settings,        label: 'Impostazioni',  id: '8' },
]

function Sidebar() {
  const [expanded, setExpanded] = useState(true)
  const location = useLocation()

  return (
    <motion.nav
      animate={{ width: expanded ? 240 : 64 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="hidden lg:flex flex-col h-full bg-[var(--bg-surface)]
        border-r border-[var(--border-subtle)] shrink-0 overflow-hidden z-10"
      aria-label="Navigazione principale"
    >
      {/* Logo */}
      <div className="flex items-center h-[var(--header-height)] px-4 shrink-0 border-b border-[var(--border-subtle)]">
        <AnimatePresence mode="wait">
          {expanded ? (
            <motion.span
              key="logo-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-xl font-semibold text-[var(--text-primary)] whitespace-nowrap"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              vita<span style={{ color: 'var(--color-primary)' }}>OS</span>
            </motion.span>
          ) : (
            <motion.span
              key="logo-mini"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-lg font-bold"
              style={{ color: 'var(--color-primary)', fontFamily: 'var(--font-display)' }}
            >
              v
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Nav links */}
      <ul className="flex-1 py-3 space-y-0.5 overflow-hidden" role="list">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.to ||
            (item.to !== '/' && location.pathname.startsWith(item.to))
          return (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={clsx(
                  'flex items-center gap-3 mx-2 px-3 py-2.5 rounded-[var(--radius-md)]',
                  'transition-all duration-[var(--transition-fast)] relative group',
                  isActive
                    ? 'bg-[var(--color-primary-ghost)] text-[var(--color-primary)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]'
                )}
                title={!expanded ? item.label : undefined}
              >
                {isActive && (
                  <motion.span
                    layoutId="active-pill"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-[var(--color-primary)]"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <item.icon size={18} className="shrink-0" />
                <AnimatePresence>
                  {expanded && (
                    <motion.span
                      key={`label-${item.to}`}
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.15 }}
                      className="text-sm font-medium whitespace-nowrap overflow-hidden"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </NavLink>
            </li>
          )
        })}
      </ul>

      {/* Collapse toggle */}
      <div className="p-3 border-t border-[var(--border-subtle)] shrink-0">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-center p-2 rounded-[var(--radius-md)]
            text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]
            transition-colors duration-[var(--transition-fast)]"
          aria-label={expanded ? 'Comprimi sidebar' : 'Espandi sidebar'}
        >
          {expanded ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
      </div>
    </motion.nav>
  )
}

export default Sidebar
