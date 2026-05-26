import { useState, useEffect } from 'react'
import { useFirmeStore } from '@/store/useFirmeStore'
import { useAppStore } from '@/store/useAppStore'
import { useWorkSessionStore } from '@/store/useWorkSessionStore'
import { useLocation } from 'react-router-dom'
import Header from '@/components/layout/Header'
import PageWrapper from '@/components/layout/PageWrapper'
import Button from '@/components/ui/Button'
import { Plus, Timer } from 'lucide-react'
import WorkStats from './WorkStats'
import WorkChart from './WorkChart'
import WorkLog from './WorkLog'
import SessionForm from './SessionForm'
import WorkTimer from './WorkTimer'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'

function Firme() {
  const { sessions, loading } = useFirmeStore()
  const { userConfig } = useAppStore()
  const { isRunning, startSession } = useWorkSessionStore()
  const location = useLocation()
  const [formOpen, setFormOpen] = useState(false)
  const [editingSession, setEditingSession] = useState(null)
  const [timerOpen, setTimerOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get('action') === 'start-session') {
      handleStartTimer()
    }
  }, [location.search])

  const handleEdit = (session) => {
    setEditingSession(session)
    setFormOpen(true)
  }

  const handleNew = () => {
    setEditingSession(null)
    setFormOpen(true)
  }

  const handleStartTimer = () => {
    if (!isRunning) {
      startSession(format(new Date(), 'HH:mm'), format(new Date(), 'yyyy-MM-dd'))
    }
    setTimerOpen(true)
  }

  return (
    <>
      <Header
        title="Firme"
        showMonth
        showNotification
        actions={
          <>
            {/* Desktop Actions */}
            <div className="hidden lg:flex items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                icon={Timer}
                onClick={handleStartTimer}
                className="!rounded-full font-bold shadow-lg"
              >
                {isRunning ? 'Sessione attiva' : 'Timbra'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                icon={Plus}
                onClick={handleNew}
                className="font-bold !text-sm"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Manuale
              </Button>
            </div>

            {/* Mobile Actions (Unified Plus with Dropdown Bubble) */}
            <div className="lg:hidden relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className={`p-2 rounded-full border shadow-sm transition-all duration-200 flex items-center justify-center ${
                  menuOpen 
                    ? 'bg-[var(--color-primary-ghost)] text-[var(--color-primary)] border-[var(--color-primary-ghost)]' 
                    : 'bg-[var(--bg-elevated)] border-[var(--border-subtle)] text-[var(--text-primary)]'
                }`}
                aria-label="Opzioni sessione"
              >
                <motion.div
                  animate={{ rotate: menuOpen ? 45 : 0 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 22 }}
                  className="flex items-center justify-center"
                >
                  <Plus size={16} strokeWidth={2.5} />
                </motion.div>
              </button>

              <AnimatePresence>
                {menuOpen && (
                  <>
                    {/* Invisible Dismiss Overlay */}
                    <div 
                      className="fixed inset-0 z-40 bg-black/5 backdrop-blur-[0.5px]" 
                      onClick={() => setMenuOpen(false)} 
                    />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: -10 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                      className="absolute right-0 mt-2.5 z-50 w-44 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl shadow-xl py-1.5 flex flex-col text-left overflow-hidden"
                    >
                      <button
                        onClick={() => {
                          setMenuOpen(false)
                          handleStartTimer()
                        }}
                        className="flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors text-left"
                      >
                        <Timer size={14} className="text-[var(--color-primary)] shrink-0" />
                        <span>{isRunning ? 'Sessione Attiva' : 'Avvia Timer'}</span>
                      </button>
                      
                      <div className="h-[1px] bg-[var(--border-subtle)] mx-3 my-0.5" />

                      <button
                        onClick={() => {
                          setMenuOpen(false)
                          handleNew()
                        }}
                        className="flex items-center gap-3 px-4 py-2.5 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors text-left"
                      >
                        <Plus size={14} className="text-[var(--text-secondary)] shrink-0" />
                        <span>Manuale</span>
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </>
        }
      />
      <PageWrapper>
        <div className="space-y-4">
          <WorkStats sessions={sessions} userConfig={userConfig} />
          <WorkChart sessions={sessions} userConfig={userConfig} />
          <WorkLog sessions={sessions} onEdit={handleEdit} />
        </div>
      </PageWrapper>

      <SessionForm
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        sessionToEdit={editingSession}
      />

      <AnimatePresence>
        {timerOpen && (
          <WorkTimer onClose={() => setTimerOpen(false)} />
        )}
      </AnimatePresence>
    </>
  )
}

export default Firme
