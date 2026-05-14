import { useState } from 'react'
import { useFirmeStore } from '@/store/useFirmeStore'
import { useAppStore } from '@/store/useAppStore'
import Header from '@/components/layout/Header'
import PageWrapper from '@/components/layout/PageWrapper'
import Button from '@/components/ui/Button'
import { Plus } from 'lucide-react'
import WorkStats from './WorkStats'
import WorkChart from './WorkChart'
import WorkLog from './WorkLog'
import SessionForm from './SessionForm'

function Firme() {
  const { sessions, loading } = useFirmeStore()
  const { userConfig } = useAppStore()
  const [formOpen, setFormOpen] = useState(false)
  const [editingSession, setEditingSession] = useState(null)

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
          <Button 
            variant="ghost" 
            size="sm" 
            icon={Plus} 
            onClick={handleNew}
            className="font-bold !text-sm"
            style={{ fontFamily: 'var(--font-display)' }}
            hideTextMobile
          >
            Nuova Sessione
          </Button>
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
    </>
  )
}

export default Firme
