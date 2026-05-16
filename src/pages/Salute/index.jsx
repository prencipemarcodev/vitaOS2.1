import { useMemo, useState } from 'react'
import { useHealthStore } from '@/store/useHealthStore'
import Header from '@/components/layout/Header'
import PageWrapper from '@/components/layout/PageWrapper'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import GlobeProgress from './GlobeProgress'
import WorkoutHeatmap from './WorkoutHeatmap'
import RunStats from './RunStats'
import WellnessTracker from './WellnessTracker'
import { Activity, Dumbbell, Ruler, Flame, Play } from 'lucide-react'
import { AnimatePresence } from 'framer-motion'
import RunTrackingScreen from './RunTrackingScreen'
import RunSummaryModal from './RunSummaryModal'

function Salute() {
  const { workoutSessions, weightLog, gymSchedules, loading } = useHealthStore()
  const [isTracking, setIsTracking] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const [lastTracker, setLastTracker] = useState(null)

  const stats = useMemo(() => {
    const totalKm = workoutSessions.filter(s => s.type === 'corsa').reduce((s, sess) => s + (sess.run_distance_km || 0), 0)
    const lastWeight = weightLog[0]?.weight || '--'
    const totalWorkouts = workoutSessions.length
    return { totalKm, lastWeight, totalWorkouts }
  }, [workoutSessions, weightLog])

  const handleFinishRun = (tracker) => {
    setLastTracker(tracker)
    setIsTracking(false)
    setShowSummary(true)
  }

  return (
    <>
      <Header 
        title="Salute" 
        showNotification 
        actions={
          <Button 
            variant="primary" 
            size="sm" 
            icon={Play} 
            onClick={() => setIsTracking(true)}
            className="!rounded-full font-bold shadow-lg"
          >
            Inizia Corsa
          </Button>
        }
      />
      
      <PageWrapper>
        <div className="space-y-4 lg:h-full flex flex-col lg:overflow-hidden">
          {/* Top KPI Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
            <StatCard label="Peso Attuale" value={`${stats.lastWeight} kg`} icon={Ruler} color="#4a90d9" />
            <StatCard label="Allenamenti" value={stats.totalWorkouts} icon={Dumbbell} color="#9b59b6" />
            <StatCard label="Streak" value="12 gg" icon={Flame} color="#ff851b" />
            <StatCard label="Attività" value="Ottima" icon={Activity} color="#3d9970" />
          </div>

          <div className="flex-1 min-h-0 lg:grid lg:grid-cols-3 lg:gap-4 lg:space-y-0 space-y-4">
            {/* Left: Globe & Stats */}
            <div className="lg:col-span-1 flex flex-col gap-4">
              <GlobeProgress totalKm={stats.totalKm} />
            </div>

            {/* Right: Charts & Heatmap */}
            <div className="lg:col-span-2 space-y-4 lg:overflow-y-auto pr-1 pb-4">
              <WorkoutHeatmap sessions={workoutSessions} />
              <WellnessTracker />
              <RunStats sessions={workoutSessions} />
              
              <Card padding="md" className="flex flex-col gap-2">
                <h3 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Schede Palestra</h3>
                {gymSchedules.length === 0 ? (
                  <p className="text-xs text-[var(--text-muted)] italic">Nessuna scheda attiva. Creane una nelle impostazioni.</p>
                ) : (
                  gymSchedules.map(g => (
                    <div key={g.id} className="flex items-center justify-between p-2 bg-[var(--bg-base)] rounded-lg border border-[var(--border-subtle)]">
                      <span className="text-xs font-bold text-[var(--text-primary)]">{g.name}</span>
                      <Badge variant="primary" className="text-[8px]">{g.frequency || '2-3'}x/sett</Badge>
                    </div>
                  ))
                )}
              </Card>
            </div>
          </div>
        </div>
      </PageWrapper>

      {/* Fullscreen Tracking */}
      <AnimatePresence>
        {isTracking && (
          <RunTrackingScreen 
            onFinish={handleFinishRun} 
            onCancel={() => setIsTracking(false)} 
          />
        )}
      </AnimatePresence>

      {/* Summary Modal */}
      <RunSummaryModal 
        isOpen={showSummary} 
        onClose={() => setShowSummary(false)} 
        tracker={lastTracker} 
      />
    </>
  )
}

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <Card padding="sm" className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}15`, color }}>
        <Icon size={18} />
      </div>
      <div>
        <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase">{label}</p>
        <p className="text-sm font-bold text-[var(--text-primary)]">{value}</p>
      </div>
    </Card>
  )
}

export default Salute
