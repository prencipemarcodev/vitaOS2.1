// FloatingPillNav — Pillola elastica e scorrevole
import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Calendar, FileSignature,
  Wallet, MoreHorizontal, X,
  PiggyBank, Heart, StickyNote, Settings, Car
} from 'lucide-react'
import clsx from 'clsx'
import { useWorkSessionStore } from '@/store/useWorkSessionStore'

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
  { to: '/veicolo',      icon: Car,       label: 'Veicolo' },
  { to: '/impostazioni', icon: Settings,  label: 'Impostazioni' },
]

const ALL_NAV = [...MAIN_NAV, ...MORE_NAV]

export const PILL_HEIGHT = 74

function FloatingPillNav() {
  const [moreOpen, setMoreOpen] = useState(false)
  const location = useLocation()
  const scrollRef = useRef(null)
  const { isRunning } = useWorkSessionStore()

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
        className="lg:hidden fixed z-[110] bottom-0 left-0 right-0 flex justify-center pb-[calc(env(safe-area-inset-bottom,16px)/2)] pointer-events-none"
        aria-label="Navigazione principale"
      >
        <motion.div
          layout
          initial={{ y: 80, opacity: 0 }}
          animate={{ 
            y: 0, 
            opacity: 1,
            width: moreOpen ? '320px' : '270px'
          }}
          transition={{ 
            type: 'spring', 
            stiffness: 400, 
            damping: 35,
            layout: { duration: 0.3 }
          }}
          className={clsx(
            "flex items-center gap-2 px-3.5 bg-white/95 backdrop-blur-xl border border-black/5 rounded-full shadow-[0_12px_40px_-12px_rgba(0,0,0,0.2)] overflow-hidden pointer-events-auto",
          )}
          style={{ height: 54 }}
        >
          {/* Container delle icone: statico o scorrevole */}
          <div 
            ref={scrollRef}
            className={clsx(
              "flex items-center gap-1.5 h-full transition-all duration-300",
              moreOpen ? "overflow-x-auto scrollbar-hide flex-1 scroll-smooth" : "overflow-hidden shrink-0"
            )}
            style={{ 
              width: moreOpen ? 'auto' : '190px'
            }}
          >
            <AnimatePresence mode="popLayout" initial={false}>
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
                    className="shrink-0"
                  >
                    <NavLink to={item.to} onClick={() => setMoreOpen(false)}>
                      <PillButton 
                        icon={item.icon} 
                        isActive={isActive} 
                        label={item.label} 
                        showBadge={item.to === '/firme' && isRunning}
                      />
                    </NavLink>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>

          {/* Separatore visivo */}
          <div className="w-px h-5 bg-black/5 shrink-0" />

          {/* Tasto Espansione / Chiusura */}
          <div className="flex items-center shrink-0">
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

function PillButton({ icon: Icon, isActive, onClick, label, showBadge }) {
  return (
    <motion.button
      whileTap={{ scale: 0.85 }}
      whileHover={{ scale: 1.05 }}
      onClick={onClick}
      className={clsx(
        'w-[42px] h-[42px] rounded-full flex items-center justify-center transition-all duration-300 relative',
        isActive
          ? 'text-[var(--color-primary)] bg-[var(--color-primary-ghost)]'
          : 'text-[var(--text-muted)] hover:bg-black/[0.03]'
      )}
    >
      <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
      {showBadge && (
        <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-red-500 border-2 border-white animate-pulse" />
      )}
    </motion.button>
  )
}

export default FloatingPillNav
