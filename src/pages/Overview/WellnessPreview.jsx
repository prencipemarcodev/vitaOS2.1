import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Droplets, Moon, Plus, Minus } from 'lucide-react'
import Card from '@/components/ui/Card'
import { useHealthStore } from '@/store/useHealthStore'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { toast } from 'sonner'
import clsx from 'clsx'

const TODAY = format(new Date(), 'yyyy-MM-dd')
const WATER_GOAL_ML = 2000
const WATER_STEP_ML = 250

function WellnessPreview() {
  const navigate = useNavigate()
  const { sleepLog, waterLog, addWaterEntry, updateWaterEntry } = useHealthStore()

  // ── Water Logic ──
  const todayWater = waterLog.find(e => e.date === TODAY)
  const currentMl = todayWater?.amount_ml ?? 0
  const waterPct = Math.min(100, Math.round((currentMl / WATER_GOAL_ML) * 100))

  const handleAddWater = async (delta) => {
    const newAmount = Math.max(0, Math.min(5000, currentMl + delta))
    if (newAmount === currentMl) return

    // Ottimismo UI
    const tempId = todayWater?.id || 'temp-' + Date.now()
    if (!todayWater) {
      addWaterEntry({ id: tempId, date: TODAY, amount_ml: newAmount })
    } else {
      updateWaterEntry(todayWater.id, { amount_ml: newAmount })
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      if (todayWater && !todayWater.id.toString().startsWith('temp-')) {
        const { error } = await supabase
          .from('water_log')
          .update({ amount_ml: newAmount })
          .eq('id', todayWater.id)
        if (error) throw error
      } else {
        const { data, error } = await supabase
          .from('water_log')
          .insert({ user_id: user.id, date: TODAY, amount_ml: newAmount })
          .select().single()
        if (error) throw error
        updateWaterEntry(tempId, data)
      }
    } catch (err) {
      console.error(err)
      toast.error('Errore salvataggio acqua')
    }
  }

  // ── Sleep Logic ──
  const todaySleep = sleepLog.find(e => e.date === TODAY)
  const sleepHours = useMemo(() => {
    if (!todaySleep) return null
    const [bH, bM] = todaySleep.bedtime.split(':').map(Number)
    const [wH, wM] = todaySleep.wakeup.split(':').map(Number)
    let minutes = (wH * 60 + wM) - (bH * 60 + bM)
    if (minutes < 0) minutes += 24 * 60
    return (minutes / 60).toFixed(1)
  }, [todaySleep])

  return (
    <Card padding="sm" className="min-h-0 flex flex-col">
      <p className="text-xs font-medium text-[var(--text-primary)] mb-2 shrink-0">Benessere</p>
      
      <div className="grid grid-cols-2 gap-2.5 flex-1">
        {/* WATER CARD */}
        <div className="relative overflow-hidden flex flex-col p-3 rounded-[var(--radius-md)] bg-blue-50/30 border border-blue-100/50">
          <div className="flex items-center justify-between mb-1">
            <Droplets size={14} className="text-blue-500" />
            <span className="text-[10px] font-bold text-blue-600">{waterPct}%</span>
          </div>
          
          <div className="flex-1 flex flex-col justify-center items-center">
            <p className="text-xl font-black text-blue-600 tabular-nums">
              {currentMl}<span className="text-[10px] font-bold ml-0.5">ml</span>
            </p>
            <p className="text-[9px] text-blue-400 font-bold uppercase tracking-tight">Acqua</p>
          </div>

          <div className="flex items-center justify-center gap-3 mt-2">
            <button 
              onClick={() => handleAddWater(-WATER_STEP_ML)}
              className="w-7 h-7 rounded-full bg-white shadow-sm flex items-center justify-center text-blue-500 active:scale-90 transition-transform"
            >
              <Minus size={14} />
            </button>
            <button 
              onClick={() => handleAddWater(WATER_STEP_ML)}
              className="w-7 h-7 rounded-full bg-blue-500 shadow-sm flex items-center justify-center text-white active:scale-90 transition-transform"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>

        {/* SLEEP CARD */}
        <div 
          onClick={() => navigate('/salute')}
          className="relative cursor-pointer overflow-hidden flex flex-col p-3 rounded-[var(--radius-md)] bg-indigo-50/30 border border-indigo-100/50 hover:bg-indigo-50/50 transition-colors"
        >
          <div className="flex items-center justify-between mb-1">
            <Moon size={14} className="text-indigo-500" />
            <span className="text-[10px] font-bold text-indigo-400">Oggi</span>
          </div>

          <div className="flex-1 flex flex-col justify-center items-center">
            {sleepHours ? (
              <>
                <p className="text-xl font-black text-indigo-600 tabular-nums">
                  {sleepHours}<span className="text-[10px] font-bold ml-0.5">h</span>
                </p>
                <p className="text-[9px] text-indigo-400 font-bold uppercase tracking-tight">Sonno</p>
              </>
            ) : (
              <>
                <p className="text-[10px] text-center text-indigo-300 font-bold leading-tight">Nessun dato registrato</p>
              </>
            )}
          </div>

          <div className="mt-2 flex justify-center">
            <div className="px-2.5 py-1 rounded-full bg-white text-[9px] font-bold text-indigo-500 shadow-sm border border-indigo-50">
              {todaySleep ? `${todaySleep.bedtime} - ${todaySleep.wakeup}` : 'Registra'}
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

export default WellnessPreview
