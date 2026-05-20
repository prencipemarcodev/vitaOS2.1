import { useEffect } from 'react'
import { useHealthStore } from '@/store/useHealthStore'
import { useCalendarStore } from '@/store/useCalendarStore'
import { useNotificationStore } from '@/store/useNotificationStore'
import { useReminderStore } from '@/store/useReminderStore'
import { toast } from 'sonner'
import { format } from 'date-fns'

export function ReminderEngine() {
  const { sleepLog, waterLog } = useHealthStore()
  const { events } = useCalendarStore()
  const { addNotification } = useNotificationStore()
  const {
    enabled,
    sleepReminder,
    waterReminder,
    calendarReminder,
    soundEnabled,
    triggeredToday,
    addTriggered,
    resetTriggered
  } = useReminderStore()

  // Chime player using Web Audio API (delicate notification chime)
  const playChime = () => {
    if (!soundEnabled) return
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      
      const osc1 = ctx.createOscillator()
      const gain1 = ctx.createGain()
      osc1.connect(gain1)
      gain1.connect(ctx.destination)
      osc1.frequency.setValueAtTime(587.33, ctx.currentTime) // D5
      gain1.gain.setValueAtTime(0.1, ctx.currentTime)
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
      osc1.start(ctx.currentTime)
      osc1.stop(ctx.currentTime + 0.3)
      
      const osc2 = ctx.createOscillator()
      const gain2 = ctx.createGain()
      osc2.connect(gain2)
      gain2.connect(ctx.destination)
      osc2.frequency.setValueAtTime(783.99, ctx.currentTime + 0.12) // G5
      gain2.gain.setValueAtTime(0.1, ctx.currentTime + 0.12)
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
      osc2.start(ctx.currentTime + 0.12)
      osc2.stop(ctx.currentTime + 0.5)
    } catch (e) {
      console.warn('[ReminderEngine] audio error:', e)
    }
  }

  useEffect(() => {
    if (!enabled) return

    const runChecks = () => {
      const now = new Date()
      const todayStr = format(now, 'yyyy-MM-dd')
      const currentHour = now.getHours()
      const currentMin = now.getMinutes()
      const currentTimeInMins = currentHour * 60 + currentMin

      // 0. Reset triggers if date has changed
      const triggeredKeys = Object.keys(triggeredToday)
      if (triggeredKeys.length > 0) {
        const firstKey = triggeredKeys[0]
        if (!firstKey.endsWith(todayStr)) {
          resetTriggered()
          return
        }
      }

      // 1. Sleep check (from 8:30 AM to 12:00 PM)
      if (sleepReminder && currentHour >= 8 && currentHour < 12) {
        const sleepKey = `sleep-${todayStr}`
        const alreadyLogged = sleepLog.some(e => e.date === todayStr)
        if (!alreadyLogged && !triggeredToday[sleepKey]) {
          addTriggered(sleepKey)
          playChime()
          
          toast('Registra il Sonno 😴', {
            description: 'Non hai ancora registrato il sonno di stanotte. Mantieni traccia dei tuoi ritmi!',
            action: {
              label: 'Registra',
              onClick: () => {
                // Navigate/scroll to health tab or page
                const el = document.getElementById('main-content')
                if (el) el.scrollTop = 0
              }
            },
            duration: 8000
          })

          addNotification({
            id: sleepKey,
            type: 'info',
            message: '😴 Non hai ancora registrato il sonno di oggi! Traccia il tuo riposo nella sezione Salute.',
            icon: 'bell',
            category: 'Salute'
          })
        }
      }

      // 2. Water check (11:00 AM, 3:30 PM, 7:00 PM, 9:30 PM)
      if (waterReminder) {
        const todayEntry = waterLog.find(e => e.date === todayStr)
        const currentMl = todayEntry?.amount_ml ?? 0

        const waterChecks = [
          { hour: 11, minStart: 0, minEnd: 30, threshold: 500, label: 'mattina', msg: '💧 Ricordati di bere! Obiettivo mattina: 500ml.' },
          { hour: 15, minStart: 30, minEnd: 60, threshold: 1000, label: 'pomeriggio', msg: '💧 Pausa acqua! Dovresti essere a circa 1000ml a questo punto.' },
          { hour: 19, minStart: 0, minEnd: 30, threshold: 1500, label: 'sera', msg: '💧 Idratazione serale: ricordati di bere per raggiungere il tuo target.' },
          { hour: 21, minStart: 30, minEnd: 60, threshold: 2000, label: 'notte', msg: '💧 Ultimo sforzo idratazione! Concludi la giornata idratato.' },
        ]

        waterChecks.forEach((chk) => {
          if (currentHour === chk.hour && currentMin >= chk.minStart && currentMin < chk.minEnd) {
            const waterKey = `water-${chk.label}-${todayStr}`
            if (currentMl < chk.threshold && !triggeredToday[waterKey]) {
              addTriggered(waterKey)
              playChime()

              toast('Promemoria Acqua 💧', {
                description: `${chk.msg} Attualmente: ${currentMl}ml.`,
                duration: 8000
              })

              addNotification({
                id: waterKey,
                type: 'info',
                message: `${chk.msg} Sei a ${currentMl}ml di acqua oggi.`,
                icon: 'bell',
                category: 'Salute'
              })
            }
          }
        })
      }

      // 3. Calendar Event Reminder (10 minutes before event start)
      if (calendarReminder) {
        const todayEvents = events.filter(e => e.date === todayStr && e.start_time)
        todayEvents.forEach((ev) => {
          const [evH, evM] = ev.start_time.split(':').map(Number)
          const evTimeInMins = evH * 60 + evM
          const diffMins = evTimeInMins - currentTimeInMins

          // Se l'evento inizia tra 0 e 10 minuti
          if (diffMins >= 0 && diffMins <= 10) {
            const eventKey = `event-${ev.id}-${todayStr}`
            if (!triggeredToday[eventKey]) {
              addTriggered(eventKey)
              playChime()

              toast(`Impegno in arrivo 📅`, {
                description: `"${ev.title}" sta per iniziare alle ore ${ev.start_time}!`,
                duration: 8000
              })

              addNotification({
                id: eventKey,
                type: 'info',
                message: `📅 Promemoria: l'impegno "${ev.title}" (${ev.category}) sta per iniziare alle ${ev.start_time}!`,
                icon: 'bell',
                category: 'Calendario'
              })
            }
          }
        })
      }
    }

    // Esegui immediatamente e poi ogni 30 secondi
    runChecks()
    const interval = setInterval(runChecks, 30000)
    return () => clearInterval(interval)
  }, [
    enabled,
    sleepReminder,
    waterReminder,
    calendarReminder,
    sleepLog,
    waterLog,
    events,
    triggeredToday,
    addTriggered,
    resetTriggered,
    addNotification
  ])

  return null
}
