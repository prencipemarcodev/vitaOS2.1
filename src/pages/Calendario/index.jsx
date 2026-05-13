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
          <Button variant="primary" size="sm" icon={Plus} onClick={() => setModalOpen(true)}>
            Nuovo Evento
          </Button>
        }
      />

      <PageWrapper noPadding>
        <div className="h-full flex flex-col p-3 lg:p-4 overflow-hidden">
          <CalendarGrid 
            selectedMonth={selectedMonth} 
            events={events} 
            absences={absences} 
            onDayClick={handleDayClick} 
          />
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
