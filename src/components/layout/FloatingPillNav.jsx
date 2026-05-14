// FloatingPillNav — Pillola elastica e scorrevole
import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Calendar, FileSignature,
  Wallet, MoreHorizontal, X,
  PiggyBank, Heart, StickyNote, Settings
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

const ALL_NAV = [...MAIN_NAV, ...MORE_NAV]

export const PILL_HEIGHT = 56

function FloatingPillNav() {
  const [moreOpen, setMoreOpen] = useState(false)
  const location = useLocation()
  const scrollRef = useRef(null)

  // Quando si apre, scrolla all'inizio per sicurezza
  useEffect(() => {
    if (moreOpen && scrollRef.current) {
      scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' })
    }
  }, [moreOpen])

  return createPortal(
    <>
      {/* Backdrop leggero quando espanso per focus */}
      <AnimatePresence>
        {moreOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMoreOpen(false)}
            className="fixed inset-0 z-[100] bg-black/5 backdrop-blur-[1px] lg:hidden"
          />
        )}
      </AnimatePresence>

      <nav
        className="lg:hidden fixed z-[110] bottom-4 left-0 right-0 flex justify-center px-4"
        aria-label="Navigazione principale"
      >
        <motion.div
          layout
          initial={{ y: 80, opacity: 0 }}
          animate={{ 
            y: 0, 
            opacity: 1,
            width: moreOpen ? '100%' : 'auto'
          }}
          transition={{ 
            type: 'spring', 
            stiffness: 400, 
            damping: 30,
            layout: { duration: 0.3 }
          }}
          className={clsx(
            "flex items-center gap-1 px-2 bg-white/95 backdrop-blur-md border border-[var(--border-default)] rounded-full shadow-[var(--shadow-lg)] overflow-hidden",
            moreOpen ? "max-w-full" : "max-w-[max-content]"
          )}
          style={{ height: PILL_HEIGHT }}
        >
          {/* Container Scrollabile */}
          <div 
            ref={scrollRef}
            className={clsx(
              "flex items-center gap-1 overflow-x-auto scrollbar-hide px-1 h-full transition-all duration-300",
              moreOpen ? "flex-1 scroll-smooth" : "flex-initial"
            )}
          >
            <AnimatePresence mode="popLayout">
              {(moreOpen ? ALL_NAV : MAIN_NAV).map((item) => {
                const isActive = location.pathname === item.to || 
                                (item.to !== '/' && location.pathname.startsWith(item.to))
                return (
                  <motion.div
                    key={item.to}
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  >
                    <NavLink to={item.to} onClick={() => setMoreOpen(false)}>
                      <PillButton icon={item.icon} isActive={isActive} label={item.label} />
                    </NavLink>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>

          {/* Tasto Espansione / Chiusura */}
          <div className="flex items-center pr-1 bg-gradient-to-l from-white via-white to-transparent pl-4 h-full shrink-0">
             <motion.div layout>
              <PillButton
                icon={moreOpen ? X : MoreHorizontal}
                isActive={moreOpen}
                onClick={() => setMoreOpen(!moreOpen)}
                label="Altro"
              />
            </motion.div>
          </div>
        </motion.div>
      </nav>
    </>,
    document.body
  )
}

function PillButton({ icon: Icon, isActive, onClick, label }) {
  return (
    <motion.button
      whileTap={{ scale: 0.85 }}
      whileHover={{ scale: 1.05 }}
      onClick={onClick}
      className={clsx(
        'w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200',
        isActive
          ? 'bg-[var(--text-primary)] text-white shadow-md'
          : 'text-[var(--text-muted)] hover:bg-[var(--bg-elevated)]'
      )}
    >
      <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
    </motion.button>
  )
}

export default FloatingPillNav

