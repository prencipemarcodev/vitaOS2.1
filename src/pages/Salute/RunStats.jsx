import { useMemo } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import Card from '@/components/ui/Card'
import { format } from 'date-fns'

function RunStats({ sessions }) {
  const chartData = useMemo(() => {
    return sessions
      .filter(s => s.type === 'corsa')
      .slice(0, 10)
      .reverse()
      .map(s => ({
        date: format(new Date(s.date), 'dd/MM'),
        distance: s.run_distance_km || s.distance_km || 0,
        fullDate: format(new Date(s.date), 'dd MMMM yyyy')
      }))
  }, [sessions])

  return (
    <Card padding="md" className="h-[240px] flex flex-col">
      <h3 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-4">Ultime Corse (KM)</h3>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-white border border-[var(--border-subtle)] p-4 shadow-2xl rounded-[var(--radius-lg)]">
                      <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1 tracking-widest">{payload[0].payload.fullDate}</p>
                      <p className="text-lg font-bold text-[var(--text-primary)]">{payload[0].value} km</p>
                    </div>
                  )
                }
                return null
              }}
            />
            <Area type="monotone" dataKey="distance" stroke="#4a90d9" fill="#4a90d910" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}

export default RunStats
