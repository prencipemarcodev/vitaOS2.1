import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Palette, Clock, Wallet, Tag, Calendar, Heart, Trash2, Download,
} from 'lucide-react'
import Header from '@/components/layout/Header'
import PageWrapper from '@/components/layout/PageWrapper'
import AppearanceSection from './AppearanceSection'
import WorkSection from './WorkSection'
import IncomeSection from './IncomeSection'
import FinanceSection from './FinanceSection'
import CalendarSection from './CalendarSection'
import HealthSection from './HealthSection'
import ResetSection from './ResetSection'
import clsx from 'clsx'

const SECTIONS = [
  { id: 'aspetto',     label: 'Aspetto',      icon: Palette },
  { id: 'lavoro',      label: 'Lavoro',       icon: Clock },
  { id: 'reddito',     label: 'Reddito',      icon: Wallet },
  { id: 'finanze',     label: 'Finanze',      icon: Tag },
  { id: 'calendario',  label: 'Calendario',   icon: Calendar },
  { id: 'salute',      label: 'Salute',       icon: Heart },
  { id: 'reset',       label: 'Reset',        icon: Trash2 },
]

const SECTION_COMPONENTS = {
  aspetto:    AppearanceSection,
  lavoro:     WorkSection,
  reddito:    IncomeSection,
  finanze:    FinanceSection,
  calendario: CalendarSection,
  salute:     HealthSection,
  reset:      ResetSection,
}

function Impostazioni() {
  const [activeSection, setActiveSection] = useState('aspetto')
  const ActiveComponent = SECTION_COMPONENTS[activeSection]

  return (
    <>
      <Header title="Impostazioni" showNotification={false} />
      <PageWrapper noPadding>
        <div className="flex flex-1 overflow-hidden">
          {/* ── Sidebar sezioni (desktop) ── */}
          <nav className="hidden md:flex flex-col w-52 shrink-0 border-r border-[var(--border-subtle)] bg-[var(--bg-surface)] overflow-y-auto py-2">
            {SECTIONS.map((s) => {
              const isActive = s.id === activeSection
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={clsx(
                    'flex items-center gap-2.5 mx-2 px-3 py-2 rounded-[var(--radius-md)]',
                    'text-sm transition-all duration-[var(--transition-fast)] text-left',
                    isActive
                      ? 'bg-[var(--color-primary-ghost)] text-[var(--color-primary)] font-medium'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]',
                    s.id === 'reset' && !isActive && 'text-[var(--color-danger)] hover:text-[var(--color-danger)]'
                  )}
                >
                  <s.icon size={16} />
                  <span>{s.label}</span>
                </button>
              )
            })}
          </nav>

          {/* ── Sezione mobile (tabs scroll orizzontale) ── */}
          <div className="md:hidden flex items-center gap-1 px-3 py-2 border-b border-[var(--border-subtle)] overflow-x-auto shrink-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {SECTIONS.map((s) => {
              const isActive = s.id === activeSection
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={clsx(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium shrink-0',
                    'transition-colors',
                    isActive
                      ? 'bg-[var(--color-primary)] text-white'
                      : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)]'
                  )}
                >
                  <s.icon size={12} />
                  {s.label}
                </button>
              )
            })}
          </div>

          {/* ── Contenuto sezione ── */}
          <div className="flex-1 overflow-y-auto p-4 lg:p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="max-w-2xl"
              >
                <ActiveComponent />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </PageWrapper>
    </>
  )
}

export default Impostazioni
