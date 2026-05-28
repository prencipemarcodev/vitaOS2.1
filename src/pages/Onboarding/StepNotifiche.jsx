import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Bell, Moon, Droplets, Calendar, Volume2, VolumeX, Shield, Send, Trash2 } from 'lucide-react'
import Card from '@/components/ui/Card'
import { useReminderStore } from '@/store/useReminderStore'
import { toast } from 'sonner'

function Toggle({ checked, onChange, label, description, icon: Icon, iconColor = 'text-[var(--color-primary)]' }) {
  return (
    <div className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:bg-[var(--bg-surface)] transition-all">
      <div className="flex items-start gap-3">
        {Icon && (
          <div className={`w-8 h-8 rounded-xl bg-black/5 dark:bg-white/5 flex items-center justify-center shrink-0 ${iconColor}`}>
            <Icon size={16} />
          </div>
        )}
        <div>
          <p className="text-xs font-bold text-[var(--text-primary)] leading-tight">{label}</p>
          {description && <p className="text-[10px] text-[var(--text-muted)] mt-1 font-medium leading-normal">{description}</p>}
        </div>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`w-10 h-6 rounded-full p-0.5 transition-colors relative shrink-0 ${
          checked ? 'bg-[var(--color-primary)]' : 'bg-black/10 dark:bg-white/10'
        }`}
      >
        <div
          className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform transform ${
            checked ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  )
}

export default function StepNotifiche({ formData, updateFormData }) {
  // Ci colleghiamo direttamente al reminder store per caricare/salvare
  const {
    enabled,
    sleepReminder,
    waterReminder,
    calendarReminder,
    soundEnabled,
    reminderTimes = ['09:00'],
    setSetting,
    addReminderTime,
    removeReminderTime,
    updateReminderTime
  } = useReminderStore()

  const [permission, setPermission] = useState(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  )

  const requestPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const res = await Notification.requestPermission()
      setPermission(res)
      if (res === 'granted') {
        toast.success('Notifiche attivate con successo per questo dispositivo!')
      } else if (res === 'denied') {
        toast.error('Permesso negato. Puoi sbloccarle manualmente dalle impostazioni del browser.')
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="text-center space-y-2">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
          className="w-16 h-16 mx-auto rounded-2xl bg-[var(--color-primary-ghost)] flex items-center justify-center"
        >
          <Bell size={28} className="text-[var(--color-primary)]" />
        </motion.div>
        <h2 className="text-2xl font-medium text-[var(--text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>
          Promemoria & Notifiche
        </h2>
        <p className="text-sm text-[var(--text-secondary)] max-w-sm mx-auto">
          Attiva le notifiche per ricevere promemoria sul sonno, l'idratazione e le attività a calendario.
        </p>
      </div>

      {/* Notifiche di Sistema (Browser/OS) */}
      {typeof window !== 'undefined' && 'Notification' in window && (
        <Card padding="lg" className="space-y-3 border-[var(--color-primary-ghost)] bg-[var(--color-primary-ghost)]/5">
          <div className="flex items-center gap-2 text-[var(--color-primary)]">
            <Shield size={16} />
            <h3 className="text-xs font-black uppercase tracking-widest">Notifiche di Sistema (Browser)</h3>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs font-bold text-[var(--text-primary)]">
                {permission === 'granted' ? 'Stato: Notifiche Attive 🟢' : permission === 'denied' ? 'Stato: Notifiche Bloccate 🔴' : 'Consenti avvisi del browser'}
              </p>
              <p className="text-[10px] text-[var(--text-muted)] font-medium leading-normal">
                Consenti a VitaOS di inviarti notifiche desktop di sistema per non perdere i promemoria importanti.
              </p>
            </div>
            {permission === 'default' && (
              <button
                type="button"
                onClick={requestPermission}
                className="px-4 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-xs font-bold rounded-xl transition-all shadow-md shrink-0"
              >
                Abilita Notifiche
              </button>
            )}
          </div>
        </Card>
      )}

      {/* Abilitazione Globale */}
      <Card padding="lg" className="space-y-4">
        <Toggle
          checked={enabled}
          onChange={(v) => setSetting('enabled', v)}
          label="Abilita Promemoria VitaOS"
          description="Abilita globalmente tutti i promemoria e le notifiche automatiche dell'applicazione."
          icon={Bell}
          iconColor="text-[var(--color-primary)]"
        />
      </Card>

      {/* Orari e Abitudini */}
      {enabled && (
        <>
          {/* Abitudini */}
          <Card padding="lg" className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)]">Abitudini & Salute</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Toggle
                checked={sleepReminder}
                onChange={(v) => setSetting('sleepReminder', v)}
                label="Check-in Sonno"
                description="Ti ricorda la mattina di registrare la qualità e le ore di sonno."
                icon={Moon}
                iconColor="text-indigo-500"
              />
              <Toggle
                checked={waterReminder}
                onChange={(v) => setSetting('waterReminder', v)}
                label="Promemoria Idratazione"
                description="Invia avvisi per aiutarti a bere acqua durante il giorno."
                icon={Droplets}
                iconColor="text-blue-500"
              />
            </div>
          </Card>

          {/* Calendario e Audio */}
          <Card padding="lg" className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)]">Calendario & Audio</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Toggle
                checked={calendarReminder}
                onChange={(v) => setSetting('calendarReminder', v)}
                label="Promemoria Impegni"
                description="Ti avvisa 10 minuti prima dell'inizio delle attività."
                icon={Calendar}
                iconColor="text-emerald-500"
              />
              <Toggle
                checked={soundEnabled}
                onChange={(v) => setSetting('soundEnabled', v)}
                label="Avviso Acustico"
                description="Riproduce un suono rilassante all'arrivo dei promemoria."
                icon={soundEnabled ? Volume2 : VolumeX}
                iconColor="text-amber-500"
              />
            </div>
          </Card>

          {/* Pianificazione Oraria */}
          <Card padding="lg" className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)]">Pianificazione Promemoria</h3>
                <p className="text-[10px] text-[var(--text-muted)] font-medium leading-normal">
                  Imposta gli orari preferiti in cui desideri ricevere i riepiloghi sull'idratazione.
                </p>
              </div>
              <button
                type="button"
                onClick={() => addReminderTime('09:00')}
                className="px-3 py-1.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-[10px] font-bold rounded-xl transition-all shadow-md shrink-0 flex items-center gap-1"
              >
                <span>+</span> Aggiungi
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {reminderTimes.map((time, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-2 p-2 px-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[var(--color-primary)] transition-all"
                >
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => updateReminderTime(idx, e.target.value)}
                    className="bg-transparent text-xs font-bold text-[var(--text-primary)] focus:outline-none w-full cursor-pointer"
                  />
                  {reminderTimes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeReminderTime(idx)}
                      className="p-1 hover:bg-black/5 dark:hover:bg-white/5 text-[var(--color-danger)] rounded-lg transition-colors shrink-0"
                      title="Elimina orario"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
