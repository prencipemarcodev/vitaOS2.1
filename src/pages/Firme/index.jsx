import { useState } from 'react'
import { useFirmeStore } from '@/store/useFirmeStore'
import { useAppStore } from '@/store/useAppStore'
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

function Firme() {
  const { sessions, loading } = useFirmeStore()
  const { userConfig } = useAppStore()
  const [formOpen, setFormOpen] = useState(false)
  const [editingSession, setEditingSession] = useState(null)
  const [timerOpen, setTimerOpen] = useState(false)

  const handleEdit = (session) => {
    setEditingSession(session)
    setFormOpen(true)
  }

  const handleNew = () => {
    setEditingSession(null)
    setFormOpen(true)
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
              onClick={() => setTimerOpen(true)}
              className="!rounded-full font-bold shadow-lg"
              hideTextMobile
            >
              Timbra
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
        <div className="space-y-4 lg:grid lg:grid-cols-3 lg:gap-4 lg:space-y-0 lg:h-full lg:overflow-hidden">
          {/* Colonna Sinistra: KPI + Chart */}
          <div className="lg:col-span-2 space-y-4 flex flex-col lg:h-full lg:overflow-hidden">
            <WorkStats sessions={sessions} userConfig={userConfig} />
            <div className="flex-1 min-h-0">
              <WorkChart sessions={sessions} userConfig={userConfig} />
            </div>
          </div>

          {/* Colonna Destra: Log */}
          <div className="lg:h-full lg:overflow-y-auto pr-1">
            <WorkLog sessions={sessions} onEdit={handleEdit} userConfig={userConfig} />
          </div>
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
