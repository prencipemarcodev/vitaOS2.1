import { useState } from 'react'
import { useCalendarStore } from '@/store/useCalendarStore'
import { useAppStore } from '@/store/useAppStore'
import Header from '@/components/layout/Header'
import PageWrapper from '@/components/layout/PageWrapper'
import CalendarGrid from './CalendarGrid'
import DayDrawer from './DayDrawer'
import EventModal from './EventModal'
import Button from '@/components/ui/Button'
import { Plus } from 'lucide-react'

function Calendario() {
  const { events, absences, loading } = useCalendarStore()
  const { selectedMonth } = useAppStore()
  
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)

  const handleDayClick = (date) => {
    setSelectedDate(date)
    setDrawerOpen(true)
  }

  const handleAddEvent = () => {
    setDrawerOpen(false)
    setModalOpen(true)
  }

  return (
    <>
      <Header 
        title="Calendario" 
        showMonth 
        showNotification 
        actions={
          <Button 
            variant="ghost" 
            size="sm" 
            icon={Plus} 
            onClick={() => setModalOpen(true)}
            className="font-bold !text-sm"
            style={{ fontFamily: 'var(--font-display)' }}
            hideTextMobile
          >
            Nuovo Evento
          </Button>
        }
      />

      <PageWrapper>
        <div className="flex-1 flex flex-col p-2 lg:p-4 overflow-hidden space-y-3">
          {/* Top Summary Badges (Mobile Optimized) */}
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar lg:hidden">
            <div className="shrink-0 px-3 py-1.5 bg-orange-50 rounded-full flex items-center gap-2 border border-orange-100">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
              <span className="text-[10px] font-black text-orange-700 uppercase">{absences.filter(a => a.type === 'ferie').length} Ferie usate</span>
            </div>
            <div className="shrink-0 px-3 py-1.5 bg-blue-50 rounded-full flex items-center gap-2 border border-blue-100">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span className="text-[10px] font-black text-blue-700 uppercase">
                {events.filter(e => {
                  const today = new Date().toISOString().split('T')[0]
                  return e.date === today
                }).length} Eventi oggi
              </span>
            </div>
            <div className="shrink-0 px-3 py-1.5 bg-green-50 rounded-full flex items-center gap-2 border border-green-100">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span className="text-[10px] font-black text-green-700 uppercase">Prossimo ponte: 2 Giugno</span>
            </div>
          </div>

          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            <CalendarGrid 
              selectedMonth={selectedMonth} 
              events={events} 
              absences={absences} 
              onDayClick={handleDayClick} 
            />
          </div>

          {/* Legend (Mobile Only) */}
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 py-2 lg:hidden">
            {[
              { label: 'Lavoro', color: 'bg-orange-500' },
              { label: 'Ferie', color: 'bg-green-500' },
              { label: 'Studio', color: 'bg-blue-500' },
              { label: 'Salute', color: 'bg-emerald-500' },
              { label: 'Personale', color: 'bg-purple-500' },
              { label: 'Medico', color: 'bg-red-500' }
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${l.color}`} />
                <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{l.label}</span>
              </div>
            ))}
          </div>
        </div>
      </PageWrapper>

      <DayDrawer 
        isOpen={drawerOpen} 
        onClose={() => setDrawerOpen(false)} 
        date={selectedDate} 
        events={events} 
        absences={absences} 
        onAddEvent={handleAddEvent}
      />

      <EventModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        initialDate={selectedDate}
      />
    </>
  )
}

export default Calendario
