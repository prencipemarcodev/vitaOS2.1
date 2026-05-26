import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Palette, Clock, Wallet, Tag, Calendar, Heart, Trash2, Download, Car, Bell
} from 'lucide-react'
import Header from '@/components/layout/Header'
import PageWrapper from '@/components/layout/PageWrapper'
import AppearanceSection from './AppearanceSection'
import WorkSection from './WorkSection'
import IncomeSection from './IncomeSection'
import FinanceSection from './FinanceSection'
import CalendarSection from './CalendarSection'
import HealthSection from './HealthSection'
import VehicleSection from './VehicleSection'
import ReminderSection from './ReminderSection'
import ResetSection from './ResetSection'
import clsx from 'clsx'

const SECTIONS = [
  { id: 'aspetto',     label: 'Aspetto',      icon: Palette },
  { id: 'lavoro',      label: 'Lavoro',       icon: Clock },
  { id: 'reddito',     label: 'Reddito',      icon: Wallet },
  { id: 'finanze',     label: 'Finanze',      icon: Tag },
  { id: 'veicolo',     label: 'Veicolo',      icon: Car },
  { id: 'calendario',  label: 'Calendario',   icon: Calendar },
  { id: 'salute',      label: 'Salute',       icon: Heart },
  { id: 'notifiche',   label: 'Notifiche',    icon: Bell },
  { id: 'reset',       label: 'Reset',        icon: Trash2 },
]

const SECTION_COMPONENTS = {
  aspetto:    AppearanceSection,
  lavoro:     WorkSection,
  reddito:    IncomeSection,
  finanze:    FinanceSection,
  veicolo:    VehicleSection,
  calendario: CalendarSection,
  salute:     HealthSection,
  notifiche:  ReminderSection,
  reset:      ResetSection,
}

function Impostazioni() {
  const [activeSection, setActiveSection] = useState('aspetto')
  const ActiveComponent = SECTION_COMPONENTS[activeSection]

  return (
    <>
      <Header title="Impostazioni" showNotification={false} />
      <PageWrapper noPadding>
        {/* Container principale: colonna su mobile, riga su desktop */}
        <div className="flex flex-col md:flex-row h-full overflow-hidden">
          
          {/* ── Sidebar (Desktop) ── */}
          <nav className="hidden md:flex flex-col w-56 shrink-0 bg-[var(--bg-surface)] border border-[var(--border-subtle)] my-4 ml-4 mr-1.5 rounded-[24px] shadow-[0_8px_30px_rgba(0,0,0,0.03)] py-4 overflow-y-auto custom-scrollbar">
            <div className="px-2.5 space-y-0.5" role="list">
              {SECTIONS.map((s) => {
                const isActive = s.id === activeSection
                return (
                  <button
                    key={s.id}
                    onClick={() => setActiveSection(s.id)}
                    className={clsx(
                      'w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left relative transition-all duration-[var(--transition-fast)] group',
                      isActive
                        ? 'bg-[var(--color-primary-ghost)] text-[var(--color-primary)] font-bold shadow-sm'
                        : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]',
                      s.id === 'reset' && !isActive && 'text-[var(--color-danger)] text-red-500/80 hover:bg-red-50 hover:text-red-600'
                    )}
                  >
                    <s.icon size={16} className={clsx('shrink-0 transition-transform', isActive && 'scale-110')} />
                    <span className="text-[13px] font-semibold whitespace-nowrap overflow-hidden flex-1">{s.label}</span>
                    {isActive && (
                      <motion.div 
                        layoutId="settings-active-pill"
                        className="absolute left-1 w-1 h-3.5 bg-[var(--color-primary)] rounded-full"
                      />
                    )}
                  </button>
                )
              })}
            </div>
          </nav>

          {/* ── Tabs (Mobile) ── */}
          <div className="md:hidden flex items-center gap-2 px-4 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] overflow-x-auto shrink-0 scrollbar-hide">
            {SECTIONS.map((s) => {
              const isActive = s.id === activeSection
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={clsx(
                    'flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold shrink-0 transition-all',
                    isActive
                      ? 'bg-[var(--color-primary-ghost)] text-[var(--color-primary)] shadow-sm'
                      : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)]'
                  )}
                >
                  <s.icon size={14} />
                  {s.label}
                </button>
              )
            })}
          </div>

          {/* ── Contenuto Sezione ── */}
          <main className="flex-1 overflow-y-auto bg-[var(--bg-base)] p-5 pb-[calc(var(--pill-nav-clearance)+env(safe-area-inset-bottom,0px))] lg:p-10 lg:pb-10">
            <div className="max-w-3xl mx-auto">
              <header className="mb-8">
                <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-1">
                  {SECTIONS.find(s => s.id === activeSection)?.label}
                </h2>
                <p className="text-sm text-[var(--text-muted)]">Gestisci le tue preferenze e configurazioni.</p>
              </header>
              
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeSection}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <ActiveComponent />
                </motion.div>
              </AnimatePresence>
            </div>
          </main>
        </div>
      </PageWrapper>
    </>
  )
}

export default Impostazioni
