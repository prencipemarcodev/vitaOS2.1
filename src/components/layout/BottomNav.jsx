import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Calendar, FileSignature, Wallet,
  PiggyBank, Heart, StickyNote, Settings, MoreHorizontal, X,
} from 'lucide-react'
import clsx from 'clsx'

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

/**
 * BottomNav 2.1 — Ridisegnato per robustezza mobile totale.
 * Gestisce Safe Area iOS, Blur, e allineamento perfetto delle icone.
 */
function BottomNav() {
  const [moreOpen, setMoreOpen] = useState(false)
  const location = useLocation()

  return (
    <>
      {/* Drawer "Altro" */}
      <AnimatePresence>
        {moreOpen && (
          <>
            <motion.div
              key="more-backdrop"
              className="fixed inset-0 z-[120] bg-black/40 backdrop-blur-[2px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMoreOpen(false)}
            />
            <motion.div
              key="more-drawer"
              className="fixed left-0 right-0 z-[130] bg-[var(--bg-surface)] border-t border-[var(--border-subtle)] rounded-t-[32px] shadow-[0_-8px_40px_rgba(0,0,0,0.3)]"
              style={{
                bottom: 0,
              }}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <div className="p-6 pb-32 grid grid-cols-4 gap-4">
                {MORE_NAV.map((item) => {
                  const isActive = location.pathname.startsWith(item.to)
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setMoreOpen(false)}
                      className="flex flex-col items-center gap-2 py-2 group"
                    >
                      <div className={clsx(
                        'transition-all duration-300 flex items-center justify-center w-14 h-14 rounded-full',
                        isActive ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] scale-110' : 'bg-[var(--bg-base)] text-[var(--text-muted)] group-active:scale-90'
                      )}>
                        <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                      </div>
                      <span className={clsx(
                        'text-[10px] font-bold tracking-tight uppercase transition-colors',
                        isActive ? 'text-[var(--color-primary)]' : 'text-[var(--text-muted)]'
                      )}>
                        {item.label}
                      </span>
                    </NavLink>
                  )
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Navbar Principale (Pill) */}
      <nav
        className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-[140]"
      >
        <div className="flex items-center gap-2 p-2 bg-[var(--bg-surface)]/95 backdrop-blur-xl border border-[var(--border-subtle)] rounded-full shadow-[0_16px_40px_rgba(0,0,0,0.6)]">
          {MAIN_NAV.map((item) => {
            const isActive = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to))
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={clsx(
                  "flex items-center justify-center w-[48px] h-[48px] rounded-full transition-all duration-300",
                  isActive ? "bg-[var(--color-primary)] text-white shadow-lg shadow-[var(--color-primary)]/20" : "text-[var(--text-muted)] hover:text-[var(--text-primary)] active:scale-90"
                )}
              >
                <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              </NavLink>
            )
          })}

          {/* Pulsante Altro */}
          <button
            onClick={() => setMoreOpen(!moreOpen)}
            className={clsx(
              "flex items-center justify-center w-[48px] h-[48px] rounded-full transition-all duration-300",
              moreOpen ? "bg-[var(--color-primary)] text-white shadow-lg shadow-[var(--color-primary)]/20" : "text-[var(--text-muted)] hover:text-[var(--text-primary)] active:scale-90"
            )}
          >
            {moreOpen ? <X size={22} strokeWidth={2.5} /> : <MoreHorizontal size={22} />}
          </button>
        </div>
      </nav>
    </>
  )
}

export default BottomNav
