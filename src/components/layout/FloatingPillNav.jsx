// FloatingPillNav — sostituisce BottomNav
// Pill flottante, icone-only, nessun testo visibile

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Calendar, FileSignature,
  Wallet, MoreHorizontal, X,
  PiggyBank, Heart, StickyNote, Settings
} from 'lucide-react'
import clsx from 'clsx'

// Voci principali — max 5 per stare nella pill
const MAIN_NAV = [
  { to: '/',           icon: LayoutDashboard, label: 'Home' },
  { to: '/calendario', icon: Calendar,        label: 'Agenda' },
  { to: '/firme',      icon: FileSignature,   label: 'Firme' },
  { to: '/finanze',    icon: Wallet,          label: 'Finanze' },
]

const MORE_NAV = [
  { to: '/risparmi',     icon: PiggyBank, label: 'Risparmi' },
  { to: '/salute',       icon: Heart,     label: 'Salute' },
  { to: '/note',         icon: StickyNote,label: 'Note' },
  { to: '/impostazioni', icon: Settings,  label: 'Impostazioni' },
]

// Altezza pill — usata anche da PageWrapper per il padding
export const PILL_HEIGHT = 56

function FloatingPillNav() {
  const [moreOpen, setMoreOpen] = useState(false)
  const location = useLocation()

  return createPortal(
    <>
      {/* Drawer "Altro" */}
      <AnimatePresence>
        {moreOpen && <MoreDrawer onClose={() => setMoreOpen(false)} />}
      </AnimatePresence>

      {/* Pill flottante */}
      <nav
        className="lg:hidden fixed z-[110]"
        style={{
          bottom: '12px',
          left: '50%',
          transform: 'translateX(-50%)',
        }}
        aria-label="Navigazione principale"
      >
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 32 }}
          className="flex items-center gap-1 px-3
            bg-[var(--bg-surface)] border border-[var(--border-default)]
            rounded-full shadow-[var(--shadow-lg)]"
          style={{ height: PILL_HEIGHT }}
        >
          {MAIN_NAV.map((item) => (
            <PillItem
              key={item.to}
              item={item}
              isActive={
                location.pathname === item.to ||
                (item.to !== '/' && location.pathname.startsWith(item.to))
              }
            />
          ))}

          {/* Separatore visivo */}
          <div className="w-px h-5 bg-[var(--border-subtle)] mx-1" />

          {/* Bottone "Altro" */}
          <PillButton
            icon={moreOpen ? X : MoreHorizontal}
            isActive={moreOpen}
            onClick={() => setMoreOpen(!moreOpen)}
            label="Altro"
          />
        </motion.div>
      </nav>
    </>,
    document.body
  )
}

// Singolo tasto dentro la pill
function PillItem({ item, isActive }) {
  return (
    <NavLink to={item.to} aria-label={item.label}>
      <PillButton icon={item.icon} isActive={isActive} label={item.label} />
    </NavLink>
  )
}

function PillButton({ icon: Icon, isActive, onClick, label }) {
  return (
    <motion.button
      whileTap={{ scale: 0.88 }}
      whileHover={{ scale: 1.06 }}
      transition={{ duration: 0.12 }}
      onClick={onClick}
      aria-label={label}
      className={clsx(
        'relative flex items-center justify-center',
        'w-11 h-11 rounded-full transition-colors duration-150',
        isActive
          ? 'bg-[var(--color-primary)] text-white'
          : 'text-[var(--text-muted)] hover:bg-[var(--bg-elevated)]'
      )}
    >
      <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
    </motion.button>
  )
}

function MoreDrawer({ onClose }) {
  const location = useLocation()

  return (
    <>
      <motion.div
        key="more-backdrop"
        className="fixed inset-0 z-[120] bg-black/30 backdrop-blur-[1px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        key="more-drawer"
        className="fixed left-4 right-4 z-[130] 
          bg-white/95 backdrop-blur-md
          border border-[var(--border-subtle)] 
          rounded-[32px] shadow-[var(--shadow-lg)]"
        style={{
          bottom: `calc(${PILL_HEIGHT}px + 24px)`,
        }}
        initial={{ y: 20, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 20, opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      >
        <div className="p-5 grid grid-cols-4 gap-2">
          {MORE_NAV.map((item) => {
            const isActive = location.pathname.startsWith(item.to)
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className="flex flex-col items-center gap-2 py-2 group"
              >
                <div className={clsx(
                  'w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300',
                  isActive 
                    ? 'bg-[var(--text-primary)] text-white shadow-md scale-105' 
                    : 'bg-[var(--bg-elevated)] text-[var(--text-muted)] group-active:scale-95'
                )}>
                  <item.icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                </div>
                <span className={clsx(
                  'text-[10px] font-bold tracking-tight uppercase transition-colors',
                  isActive ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'
                )} style={{ fontFamily: 'var(--font-display)' }}>
                  {item.label}
                </span>
              </NavLink>
            )
          })}
        </div>
      </motion.div>
    </>
  )
}

export default FloatingPillNav
