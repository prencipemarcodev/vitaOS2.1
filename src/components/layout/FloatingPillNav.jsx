// FloatingPillNav — Pill elastica con finestra contestuale sull'attivo
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
  { to: '/risparmi',     icon: PiggyBank,  label: 'Risparmi' },
  { to: '/salute',       icon: Heart,      label: 'Salute' },
  { to: '/note',         icon: StickyNote, label: 'Note' },
  { to: '/veicolo',      icon: Car,        label: 'Veicolo' },
  { to: '/impostazioni', icon: Settings,   label: 'Impostazioni' },
]

const ALL_NAV = [...MAIN_NAV, ...MORE_NAV]

export const PILL_HEIGHT = 74

/**
 * Calcola la "finestra" di 5 item da mostrare quando un item non-principale è attivo.
 * Centra la finestra sull'item attivo con 2 precedenti e 2 successivi.
 */
function getContextualWindow(activeIndex) {
  const total = ALL_NAV.length
  let start = activeIndex - 2
  let end = activeIndex + 2

  // Clamp ai bordi dell'array
  if (start < 0) {
    end = Math.min(total - 1, end + Math.abs(start))
    start = 0
  }
  if (end >= total) {
    start = Math.max(0, start - (end - total + 1))
    end = total - 1
  }

  return ALL_NAV.slice(start, end + 1)
}

function FloatingPillNav() {
  const [moreOpen, setMoreOpen] = useState(false)
  const location = useLocation()
  const scrollRef = useRef(null)
  const { isRunning } = useWorkSessionStore()

  // Quando si apre, scrolla all'inizio
  useEffect(() => {
    if (moreOpen && scrollRef.current) {
      scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' })
    }
  }, [moreOpen])

  // Trova l'indice dell'item attivo in ALL_NAV
  const activeIndex = ALL_NAV.findIndex(
    item => location.pathname === item.to ||
            (item.to !== '/' && location.pathname.startsWith(item.to))
  )

  // Determina quali item mostrare
  // - Se "..." aperto → tutti (scorrevoli)
  // - Se attivo è in MAIN_NAV (indice < 4) o nessuno → MAIN_NAV
  // - Se attivo è in MORE_NAV → finestra contestuale centrata sull'attivo
  const isMoreActive = activeIndex >= MAIN_NAV.length && activeIndex !== -1

  const visibleItems = moreOpen
    ? ALL_NAV
    : isMoreActive
      ? getContextualWindow(activeIndex)
      : MAIN_NAV

  return createPortal(
    <>
      {/* Backdrop quando espanso */}
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
            width: moreOpen ? '340px' : '290px'
          }}
          transition={{
            type: 'spring',
            stiffness: 400,
            damping: 35,
            layout: { duration: 0.3 }
          }}
          className={clsx(
            "flex items-center gap-2 px-3.5 pointer-events-auto overflow-hidden",
            "bg-[var(--bg-surface)]/95 backdrop-blur-md",
            "border border-[var(--border-subtle)]",
            "shadow-[0_8px_32px_-8px_rgba(0,0,0,0.14),0_2px_8px_-2px_rgba(0,0,0,0.06)]",
            "rounded-full"
          )}
          style={{ height: 54, marginBottom: 8 }}
        >
          {/* Container icone — scorrevole quando aperto */}
          <div
            ref={scrollRef}
            className={clsx(
              "flex items-center gap-1.5 h-full transition-all duration-300",
              moreOpen
                ? "overflow-x-auto scrollbar-hide flex-1 scroll-smooth"
                : "overflow-hidden shrink-0"
            )}
            style={{
              width: moreOpen ? 'auto' : '210px'
            }}
          >
            <AnimatePresence mode="popLayout" initial={false}>
              {visibleItems.map((item) => {
                const isActive =
                  location.pathname === item.to ||
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

          {/* Separatore */}
          <div className="w-px h-5 bg-[var(--border-default)] shrink-0" />

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
        'w-[42px] h-[42px] rounded-full flex flex-col items-center justify-center transition-all duration-200 relative gap-0.5',
        isActive
          ? 'text-[var(--color-primary)] bg-[var(--color-primary-ghost)]'
          : 'text-[var(--text-muted)] hover:bg-[var(--bg-elevated)]'
      )}
    >
      <Icon size={isActive ? 19 : 20} strokeWidth={isActive ? 2.5 : 2} />

      {/* Label animata solo sull'item attivo */}
      <AnimatePresence>
        {isActive && (
          <motion.span
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ fontFamily: 'var(--font-body)' }}
            className="text-[7px] font-black uppercase tracking-widest leading-none overflow-hidden whitespace-nowrap text-[var(--color-primary)]"
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>

      {showBadge && (
        <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[var(--color-danger)] border-2 border-[var(--bg-surface)] animate-pulse" />
      )}
    </motion.button>
  )
}

export default FloatingPillNav
