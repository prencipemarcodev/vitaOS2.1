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
import { AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'

function Firme() {
  const { sessions, loading } = useFirmeStore()
  const { userConfig } = useAppStore()
  const { isRunning, startSession } = useWorkSessionStore()
  const location = useLocation()
  const [formOpen, setFormOpen] = useState(false)
  const [editingSession, setEditingSession] = useState(null)
  const [timerOpen, setTimerOpen] = useState(false)

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
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              icon={Timer}
              onClick={handleStartTimer}
              className="!rounded-full font-bold shadow-lg"
              hideTextMobile
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
              hideTextMobile
            >
              Manuale
            </Button>
          </div>
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
