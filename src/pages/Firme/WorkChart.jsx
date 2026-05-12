import { useMemo } from 'react'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine
} from 'recharts'
import Card from '@/components/ui/Card'
import { startOfMonth, endOfMonth, eachDayOfInterval, format, isSameDay } from 'date-fns'
import { it } from 'date-fns/locale'

function WorkChart({ sessions, userConfig }) {
  const chartData = useMemo(() => {
    const today = new Date()
    const start = startOfMonth(today)
    const end = endOfMonth(today)
    const days = eachDayOfInterval({ start, end })

    return days.map(day => {
      const daySessions = sessions.filter(s => isSameDay(new Date(s.date), day))
      const totalMinutes = daySessions.reduce((sum, s) => sum + s.duration_minutes, 0)
      return {
        date: format(day, 'dd/MM'),
        hours: parseFloat((totalMinutes / 60).toFixed(1)),
        fullDate: format(day, 'EEEE dd MMMM', { locale: it })
      }
    })
  }, [sessions])

  const dailyTarget = (userConfig?.work_hours_per_week || 40) / 5

  return (
    <Card padding="md" className="h-[300px] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-[var(--text-primary)]">Andamento Ore Giornaliere</h3>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#3d9970]" />
            <span className="text-[10px] text-[var(--text-muted)] font-medium">Target</span>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
              interval={4}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: 'var(--text-muted)' }} 
            />
            <Tooltip 
              cursor={{ fill: 'var(--bg-elevated)', opacity: 0.4 }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-white border border-[var(--border-subtle)] p-4 shadow-2xl rounded-[var(--radius-lg)]">
                      <p className="text-[10px] font-bold text-[var(--text-muted)] mb-1 uppercase tracking-widest">
                        {payload[0].payload.fullDate}
                      </p>
                      <p className="text-lg font-bold text-[var(--text-primary)]">
                        {payload[0].value} ore
                      </p>
                    </div>
                  )
                }
                return null
              }}
            />
            <ReferenceLine y={dailyTarget} stroke="#3d9970" strokeDasharray="5 5" strokeWidth={1} />
            <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.hours >= dailyTarget ? '#4a90d9' : '#e0e0e0'} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}

export default WorkChart
