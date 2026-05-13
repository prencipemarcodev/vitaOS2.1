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
              className="fixed left-0 right-0 z-[130] bg-[var(--bg-surface)] border-t border-[var(--border-subtle)] rounded-t-[24px] shadow-[0_-8px_32px_rgba(0,0,0,0.1)]"
              style={{
                bottom: 'calc(var(--bottom-nav-height) + env(safe-area-inset-bottom, 0px))',
              }}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <div className="p-6 grid grid-cols-4 gap-4">
                {MORE_NAV.map((item) => {
                  const isActive = location.pathname.startsWith(item.to)
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setMoreOpen(false)}
                      className="flex flex-col items-center gap-2 group"
                    >
                      <div className={clsx(
                        'w-12 h-12 rounded-2xl flex items-center justify-center transition-all',
                        isActive ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] group-hover:bg-[var(--bg-hover)]'
                      )}>
                        <item.icon size={24} />
                      </div>
                      <span className={clsx(
                        'text-[10px] font-bold uppercase tracking-wider',
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

      {/* Navbar Principale */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-[140] bg-[var(--bg-surface)]/90 backdrop-blur-xl border-t border-[var(--border-subtle)]"
        style={{
          height: 'calc(var(--bottom-nav-height) + env(safe-area-inset-bottom, 0px))',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <div className="flex h-full items-center justify-around px-2">
          {MAIN_NAV.map((item) => {
            const isActive = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to))
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className="flex-1 flex flex-col items-center justify-center gap-1 group py-1"
              >
                <div className={clsx(
                  'w-10 h-7 rounded-full flex items-center justify-center transition-all duration-300',
                  isActive ? 'bg-[var(--color-primary-ghost)] text-[var(--color-primary)]' : 'text-[var(--text-muted)] group-active:scale-90'
                )}>
                  <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={clsx(
                  'text-[9px] font-bold tracking-tight transition-colors',
                  isActive ? 'text-[var(--color-primary)]' : 'text-[var(--text-muted)]'
                )}>
                  {item.label}
                </span>
              </NavLink>
            )
          })}

          {/* Pulsante Altro */}
          <button
            onClick={() => setMoreOpen(!moreOpen)}
            className="flex-1 flex flex-col items-center justify-center gap-1 group py-1"
          >
            <div className={clsx(
              'w-10 h-7 rounded-full flex items-center justify-center transition-all duration-300',
              moreOpen ? 'bg-[var(--color-primary-ghost)] text-[var(--color-primary)]' : 'text-[var(--text-muted)] group-active:scale-90'
            )}>
              {moreOpen ? <X size={22} strokeWidth={2.5} /> : <MoreHorizontal size={22} />}
            </div>
            <span className={clsx(
              'text-[9px] font-bold tracking-tight transition-colors',
              moreOpen ? 'text-[var(--color-primary)]' : 'text-[var(--text-muted)]'
            )}>
              Altro
            </span>
          </button>
        </div>
      </nav>
    </>
  )
}

export default BottomNav
