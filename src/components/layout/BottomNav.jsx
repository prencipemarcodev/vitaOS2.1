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
              className="fixed inset-0 z-40 bg-black/30"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMoreOpen(false)}
            />
            <motion.div
              key="more-drawer"
              className="fixed bottom-[calc(56px+env(safe-area-inset-bottom,0px))] left-0 right-0 z-50
                bg-white rounded-t-[var(--radius-xl)]
                border-t border-[var(--border-subtle)] shadow-[var(--shadow-lg)] p-4"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              drag="y"
              dragConstraints={{ top: 0 }}
              onDragEnd={(_, info) => { if (info.offset.y > 60) setMoreOpen(false) }}
            >
              <div className="w-8 h-1 bg-[var(--border-default)] rounded-full mx-auto mb-4" />
              <div className="grid grid-cols-4 gap-3">
                {MORE_NAV.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMoreOpen(false)}
                    className={clsx(
                      'flex flex-col items-center gap-1 py-2 px-1 rounded-[var(--radius-md)]',
                      'transition-colors',
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
        className="lg:hidden fixed bottom-0 left-0 right-0 z-[100]
          bg-white border-t border-[var(--border-subtle)]
          flex items-center justify-around shadow-[0_-2px_10px_rgba(0,0,0,0.05)]"
        style={{
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          height: 'calc(56px + env(safe-area-inset-bottom, 0px))',
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
              className="flex flex-col items-center gap-0.5 px-3 py-1"
            >
              <motion.div
                animate={{ scale: isActive ? 1 : 1 }}
                whileTap={{ scale: 0.9 }}
                className={clsx(
                  'flex flex-col items-center gap-0.5',
                  isActive ? 'text-[var(--color-primary)]' : 'text-[var(--text-muted)]'
                )}
              >
                <motion.div
                  animate={isActive ? { scale: [1, 1.15, 1] } : { scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <item.icon size={20} />
                </motion.div>
                <span className="text-[10px] font-medium">{item.label}</span>
              </motion.div>
            </NavLink>
          )
        })}

        {/* More button */}
        <button
          onClick={() => setMoreOpen(!moreOpen)}
          className={clsx(
            'flex flex-col items-center gap-0.5 px-3 py-1',
            moreOpen ? 'text-[var(--color-primary)]' : 'text-[var(--text-muted)]'
          )}
        >
          {moreOpen ? <X size={22} /> : <MoreHorizontal size={22} />}
          <span className="text-[10px] font-medium">Altro</span>
        </button>
      </nav>
    </>
  )
}

export default BottomNav
