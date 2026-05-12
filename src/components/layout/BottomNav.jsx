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
  { to: '/risparmi',     icon: PiggyBank, label: 'Risparmi', color: '#3d9970' },
  { to: '/salute',       icon: Heart,     label: 'Salute',   color: '#e05252' },
  { to: '/note',         icon: StickyNote,label: 'Note',     color: '#4a90d9' },
  { to: '/impostazioni', icon: Settings,  label: 'Impostazioni', color: '#9b59b6' },
]

function BottomNav() {
  const [moreOpen, setMoreOpen] = useState(false)
  const location = useLocation()

  return (
    <>
      {/* More drawer */}
      <AnimatePresence>
        {moreOpen && (
          <>
            {/* Backdrop with sync transition */}
            <motion.div
              key="more-backdrop"
              className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-[2px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMoreOpen(false)}
            />
            <motion.div
              key="more-drawer"
              className="fixed bottom-[calc(56px+env(safe-area-inset-bottom,0px))] left-4 right-4 z-[100]
                bg-white rounded-[24px] border border-[var(--border-subtle)]
                shadow-2xl overflow-hidden mb-2"
              initial={{ y: '120%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '120%', opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            >
              <div className="p-5 grid grid-cols-2 gap-3">
                {MORE_NAV.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMoreOpen(false)}
                    className={clsx(
                      'flex items-center gap-3 p-3 rounded-[16px] transition-all',
                      location.pathname.startsWith(item.to)
                        ? 'bg-[var(--bg-elevated)] border border-[var(--border-default)]'
                        : 'bg-[var(--bg-base)] border border-transparent hover:bg-[var(--bg-elevated)]'
                    )}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                      style={{ backgroundColor: `${item.color}15`, color: item.color }}
                    >
                      <item.icon size={20} />
                    </div>
                    <span className="text-xs font-semibold text-[var(--text-primary)]">{item.label}</span>
                  </NavLink>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom bar */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-[110]
          bg-white border-t border-[var(--border-subtle)]
          flex items-center justify-around shadow-[0_-4px_16px_rgba(0,0,0,0.06)]"
        style={{
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 2px)',
          height: 'calc(62px + env(safe-area-inset-bottom, 0px))',
        }}
        aria-label="Navigazione mobile"
      >
        {MAIN_NAV.map((item) => {
          const isActive = location.pathname === item.to ||
            (item.to !== '/' && location.pathname.startsWith(item.to))
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className="flex flex-col items-center gap-1 px-3 py-2"
            >
              <motion.div
                whileTap={{ scale: 0.9 }}
                className={clsx(
                  'flex flex-col items-center gap-1',
                  isActive ? 'text-[var(--color-primary)]' : 'text-[var(--text-muted)]'
                )}
              >
                <div className={clsx(
                  'w-8 h-8 rounded-full flex items-center justify-center transition-colors',
                  isActive ? 'bg-[var(--color-primary-ghost)]' : 'bg-transparent'
                )}>
                  <item.icon size={20} />
                </div>
                <span className="text-[9px] font-bold tracking-tight">{item.label}</span>
              </motion.div>
            </NavLink>
          )
        })}

        {/* More button */}
        <button
          onClick={() => setMoreOpen(!moreOpen)}
          className={clsx(
            'flex flex-col items-center gap-1 px-3 py-2 transition-colors',
            moreOpen ? 'text-[var(--color-primary)]' : 'text-[var(--text-muted)]'
          )}
        >
          <div className={clsx(
            'w-8 h-8 rounded-full flex items-center justify-center transition-colors',
            moreOpen ? 'bg-[var(--color-primary-ghost)]' : 'bg-transparent'
          )}>
            {moreOpen ? <X size={20} /> : <MoreHorizontal size={20} />}
          </div>
          <span className="text-[9px] font-bold tracking-tight">Altro</span>
        </button>
      </nav>
    </>
  )
}

export default BottomNav
