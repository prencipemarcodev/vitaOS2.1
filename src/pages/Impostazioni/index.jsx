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
          <nav className="hidden md:flex flex-col w-64 shrink-0 border-r border-[var(--border-subtle)] bg-white overflow-y-auto py-4">
            {SECTIONS.map((s) => {
              const isActive = s.id === activeSection
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={clsx(
                    'flex items-center gap-3 mx-4 px-4 py-2.5 rounded-xl transition-all duration-200 text-left',
                    isActive
                      ? 'bg-[var(--text-primary)] text-white font-bold shadow-lg scale-[1.02]'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-base)] hover:text-[var(--text-primary)]',
                    s.id === 'reset' && !isActive && 'text-[var(--color-danger)]'
                  )}
                >
                  <s.icon size={18} />
                  <span className="text-sm">{s.label}</span>
                </button>
              )
            })}
          </nav>

          {/* ── Tabs (Mobile) ── */}
          <div className="md:hidden flex items-center gap-2 px-4 py-3 border-b border-[var(--border-subtle)] bg-white overflow-x-auto shrink-0 scrollbar-hide">
            {SECTIONS.map((s) => {
              const isActive = s.id === activeSection
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={clsx(
                    'flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold shrink-0 transition-all',
                    isActive
                      ? 'bg-[var(--text-primary)] text-[var(--bg-surface)] shadow-md'
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
