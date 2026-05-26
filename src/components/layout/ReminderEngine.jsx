import { useEffect } from 'react'
import { useHealthStore } from '@/store/useHealthStore'
import { useCalendarStore } from '@/store/useCalendarStore'
import { useNotificationStore } from '@/store/useNotificationStore'
import { useReminderStore } from '@/store/useReminderStore'
import { useWorkSessionStore } from '@/store/useWorkSessionStore'
import { useAppStore } from '@/store/useAppStore'
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
    reminderTimes = ['09:00'],
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

    const sendSystemNotification = async (title, body) => {
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        try {
          if ('serviceWorker' in navigator) {
            const reg = await navigator.serviceWorker.ready
            reg.showNotification(title, {
              body,
              icon: "/icon-192.png",
              tag: "vitaos-reminder"
            })
          } else {
            new Notification(title, {
              body,
              icon: "/icon-192.png",
              tag: "vitaos-reminder"
            })
          }
        } catch (e) {
          console.warn('[ReminderEngine] system notification failed:', e)
        }
      }
    }

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
          
          const title = 'Registra il Sonno 😴'
          const desc = 'Non hai ancora registrato il sonno di stanotte. Mantieni traccia dei tuoi ritmi!'

          toast(title, {
            description: desc,
            action: {
              label: 'Registra',
              onClick: () => {
                const el = document.getElementById('main-content')
                if (el) el.scrollTop = 0
              }
            },
            duration: 8000
          })

          sendSystemNotification(title, desc)

          addNotification({
            id: sleepKey,
            type: 'info',
            message: `😴 ${desc}`,
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

              const title = 'Promemoria Acqua 💧'
              const body = `${chk.msg} Attualmente: ${currentMl}ml.`

              toast(title, {
                description: body,
                duration: 8000
              })

              sendSystemNotification(title, body)

              addNotification({
                id: waterKey,
                type: 'info',
                message: body,
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

              const title = 'Impegno in arrivo 📅'
              const body = `"${ev.title}" sta per iniziare alle ore ${ev.start_time}!`

              toast(title, {
                description: body,
                duration: 8000
              })

              sendSystemNotification(title, body)

              addNotification({
                id: eventKey,
                type: 'info',
                message: `📅 Promemoria: ${body}`,
                icon: 'bell',
                category: 'Calendario'
              })
            }
          }
        })
      }

      // 4. Custom Scheduled Reminders
      const currentTimes = reminderTimes || ['09:00']
      currentTimes.forEach((timeStr) => {
        const [remH, remM] = timeStr.split(':').map(Number)
        if (currentHour === remH && currentMin === remM) {
          const customKey = `custom-${timeStr}-${todayStr}`
          if (!triggeredToday[customKey]) {
            addTriggered(customKey)
            playChime()

            const todayEntry = waterLog.find(e => e.date === todayStr)
            const currentMl = todayEntry?.amount_ml ?? 0
            
            let msg = "Promemoria giornaliero VitaOS! Come sta andando la tua giornata?"
            if (currentMl < 1000) {
              msg = `💧 Non dimenticare di idratarti! Oggi hai bevuto solo ${currentMl}ml di acqua.`
            } else {
              msg = `🌟 Ottimo lavoro! Hai già bevuto ${currentMl}ml di acqua oggi.`
            }

            const title = "Promemoria VitaOS 🔔"
            toast(title, {
              description: msg,
              duration: 8000
            })

            sendSystemNotification(title, msg)

            addNotification({
              id: customKey,
              type: 'info',
              message: msg,
              icon: 'bell',
              category: 'Salute'
            })
          }
        }
      })
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
    reminderTimes,
    sleepLog,
    waterLog,
    events,
    triggeredToday,
    addTriggered,
    resetTriggered,
    addNotification
  ])

  // 5. Prolonged Work Session Check
  const { isRunning, elapsed, checkIn, checkInDate } = useWorkSessionStore()
  const { userConfig } = useAppStore()

  useEffect(() => {
    if (!isRunning || !checkIn || !checkInDate) return

    const alertEnabled = userConfig?.work_session_alert_enabled ?? true
    if (!alertEnabled) return

    const alertHours = userConfig?.work_session_alert_hours ?? userConfig?.daily_hours ?? 8
    const elapsedSeconds = elapsed
    const thresholdSeconds = alertHours * 3600

    if (elapsedSeconds >= thresholdSeconds) {
      const sessionAlertKey = `work-session-alert-${checkInDate}-${checkIn}`
      
      // Controlla se la notifica per questa specifica sessione è già stata inviata
      if (!triggeredToday[sessionAlertKey]) {
        addTriggered(sessionAlertKey)
        playChime()

        const title = 'Stai ancora lavorando? 💼'
        const body = `Il tuo timer è attivo da oltre ${alertHours} ore. Ricordati di fermarlo o regolare gli orari.`

        toast(title, {
          description: body,
          action: {
            label: 'Gestisci',
            onClick: () => {
              useWorkSessionStore.getState().setFullTimerOpen(true)
            }
          },
          duration: 12000
        })

        // Invia notifica di sistema nativa
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          try {
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.ready.then(reg => {
                reg.showNotification(title, {
                  body,
                  icon: "/icon-192.png",
                  tag: "vitaos-session-alert"
                })
              })
            } else {
              new Notification(title, {
                body,
                icon: "/icon-192.png",
                tag: "vitaos-session-alert"
              })
            }
          } catch (e) {}
        }

        // Aggiungi a Notification Center
        addNotification({
          id: sessionAlertKey,
          type: 'info',
          message: body,
          icon: 'bell',
          category: 'Sistema',
          action: () => {
            useWorkSessionStore.getState().setFullTimerOpen(true)
          }
        })
      }
    }
  }, [
    isRunning,
    elapsed,
    checkIn,
    checkInDate,
    userConfig?.work_session_alert_enabled,
    userConfig?.work_session_alert_hours,
    userConfig?.daily_hours,
    triggeredToday,
    addTriggered,
    addNotification
  ])

  return null
}
