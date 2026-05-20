import React, { useState } from 'react'
import { useReminderStore } from '@/store/useReminderStore'
import Card from '@/components/ui/Card'
import { Bell, Moon, Droplets, Calendar, Volume2, VolumeX, Shield } from 'lucide-react'
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

function ReminderSection() {
  const {
    enabled,
    sleepReminder,
    waterReminder,
    calendarReminder,
    soundEnabled,
    setSetting
  } = useReminderStore()

  const [permission, setPermission] = useState(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  )

  const requestPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const res = await Notification.requestPermission()
      setPermission(res)
      if (res === 'granted') {
        toast.success('Notifiche di sistema attive! Riceverai gli avvisi sul tuo desktop/dispositivo.')
      } else if (res === 'denied') {
        toast.error('Permesso negato. Abilita le notifiche manualmente nelle impostazioni del browser.')
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Notifiche di Sistema (Browser/OS) */}
      {typeof window !== 'undefined' && 'Notification' in window && (
        <Card padding="lg" className="space-y-4 border-[var(--color-primary-ghost)] bg-[var(--color-primary-ghost)]/5">
          <div className="flex items-center gap-2 text-[var(--color-primary)]">
            <Shield size={16} />
            <h3 className="text-xs font-black uppercase tracking-widest">Notifiche di Sistema (Browser)</h3>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs font-bold text-[var(--text-primary)]">
                {permission === 'granted' ? 'Stato: Notifiche Attive 🟢' : permission === 'denied' ? 'Stato: Notifiche Bloccate 🔴' : 'Abilita Notifiche Desktop'}
              </p>
              <p className="text-[10px] text-[var(--text-muted)] font-medium leading-relaxed">
                {permission === 'granted' 
                  ? 'Il browser ha l\'autorizzazione per inviarti notifiche desktop nativa.' 
                  : permission === 'denied' 
                  ? 'Hai bloccato le notifiche di sistema. Sbloccale nelle impostazioni del browser per ricevere gli avvisi.'
                  : 'Consenti a VitaOS di inviarti notifiche desktop di sistema per i promemoria e gli avvisi importanti.'}
              </p>
            </div>
            {permission === 'default' && (
              <button
                onClick={requestPermission}
                className="px-4 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-xs font-bold rounded-xl transition-all shadow-md shrink-0"
              >
                Abilita Notifiche
              </button>
            )}
          </div>
        </Card>
      )}

      {/* Card Globale */}
      <Card padding="lg" className="space-y-4">
        <div className="flex items-center gap-2">
          <Bell size={16} className="text-[var(--color-primary)]" />
          <h3 className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)]">Sistema Notifiche</h3>
        </div>
        <p className="text-xs text-[var(--text-muted)]">
          Configura e personalizza i promemoria intelligenti di VitaOS. Riceverai notifiche e avvisi visivi per aiutarti a mantenere le tue abitudini sane e non perdere i tuoi impegni giornalieri.
        </p>

        <Toggle
          checked={enabled}
          onChange={(v) => setSetting('enabled', v)}
          label="Notifiche VitaOS"
          description="Abilita o disabilita globalmente tutti i promemoria e le notifiche automatiche dell'applicazione."
          icon={Bell}
          iconColor="text-[var(--color-primary)]"
        />
      </Card>

      {/* Dettaglio Abitudini */}
      {enabled && (
        <Card padding="lg" className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)]">Abitudini & Salute</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Toggle
              checked={sleepReminder}
              onChange={(v) => setSetting('sleepReminder', v)}
              label="Check-in Sonno"
              description="Ti ricorda la mattina se non hai inserito la qualità e le ore di sonno della notte precedente."
              icon={Moon}
              iconColor="text-indigo-500"
            />
            <Toggle
              checked={waterReminder}
              onChange={(v) => setSetting('waterReminder', v)}
              label="Promemoria Idratazione"
              description="Invia notifiche delicate durante il giorno per aiutarti a raggiungere l'obiettivo dei 2 litri d'acqua."
              icon={Droplets}
              iconColor="text-blue-500"
            />
          </div>
        </Card>
      )}

      {/* Dettaglio Calendario & Suono */}
      {enabled && (
        <Card padding="lg" className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)]">Calendario & Audio</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Toggle
              checked={calendarReminder}
              onChange={(v) => setSetting('calendarReminder', v)}
              label="Promemoria Impegni"
              description="Ti avvisa 10 minuti prima dell'inizio di ogni attività inserita nel tuo calendario (lavoro, studio, palestra...)."
              icon={Calendar}
              iconColor="text-emerald-500"
            />
            <Toggle
              checked={soundEnabled}
              onChange={(v) => setSetting('soundEnabled', v)}
              label="Avviso Acustico Delicato"
              description="Riproduce un suono ad alta fedeltà rilassante per attirare dolcemente la tua attenzione."
              icon={soundEnabled ? Volume2 : VolumeX}
              iconColor="text-amber-500"
            />
          </div>
        </Card>
      )}
    </div>
  )
}

export default ReminderSection
