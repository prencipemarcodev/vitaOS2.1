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

function BottomNav() {
  const [moreOpen, setMoreOpen] = useState(false)
  const location = useLocation()

  return (
    <>
      {/* More drawer */}
      <AnimatePresence>
        {moreOpen && (
          <>
            <motion.div
              key="more-backdrop"
              className="fixed inset-0 z-[90] bg-black/30"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMoreOpen(false)}
            />
            <motion.div
              key="more-drawer"
              className="fixed bottom-[calc(62px+env(safe-area-inset-bottom,0px))] left-0 right-0 z-[100]
                bg-white border-t border-[var(--border-subtle)] shadow-[var(--shadow-lg)]"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <div className="p-4 grid grid-cols-4 gap-2">
                {MORE_NAV.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMoreOpen(false)}
                    className={clsx(
                      'flex flex-col items-center gap-1.5 py-3 px-1 transition-colors',
                      location.pathname.startsWith(item.to)
                        ? 'text-[var(--color-primary)] bg-[var(--color-primary-ghost)]'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]'
                    )}
                  >
                    <item.icon size={22} />
                    <span className="text-[10px] font-medium">{item.label}</span>
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
          bg-white/80 backdrop-blur-lg border-t border-[var(--border-subtle)]
          flex items-end justify-around shadow-[0_-8px_32px_rgba(0,0,0,0.05)]"
        style={{
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 8px)',
          height: 'calc(54px + env(safe-area-inset-bottom, 0px))',
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
              className="flex-1 flex flex-col items-center"
            >
              <motion.div
                whileTap={{ scale: 0.9 }}
                className={clsx(
                  'flex flex-col items-center gap-1',
                  isActive ? 'text-[var(--color-primary)]' : 'text-[var(--text-muted)]'
                )}
              >
                <div className={clsx(
                  'w-9 h-9 rounded-full flex items-center justify-center transition-colors',
                  isActive ? 'bg-[var(--color-primary-ghost)]' : 'bg-transparent'
                )}>
                  <item.icon size={22} />
                </div>
                <span className="text-[10px] font-bold tracking-tight">{item.label}</span>
              </motion.div>
            </NavLink>
          )
        })}

        {/* More button */}
        <button
          onClick={() => setMoreOpen(!moreOpen)}
          className={clsx(
            'flex-1 flex flex-col items-center transition-colors',
            moreOpen ? 'text-[var(--color-primary)]' : 'text-[var(--text-muted)]'
          )}
        >
          <div className={clsx(
            'w-9 h-9 rounded-full flex items-center justify-center transition-colors',
            moreOpen ? 'bg-[var(--color-primary-ghost)]' : 'bg-transparent'
          )}>
            {moreOpen ? <X size={22} /> : <MoreHorizontal size={22} />}
          </div>
          <span className="text-[10px] font-bold tracking-tight">Altro</span>
        </button>
      </nav>
    </>
  )
}

export default BottomNav
