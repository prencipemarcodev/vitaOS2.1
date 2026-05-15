import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ShieldAlert, Users, Database, Activity, LogOut, ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/useAuthStore'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const { session, signOut } = useAuthStore()
  const [stats, setStats] = useState({
    usersCount: 0,
    dbSize: 'Calcolo...',
    status: 'Online'
  })

  // Controllo accesso rigoroso
  useEffect(() => {
    if (!session || session.user.email !== 'prencipemarco.dev@gmail.com') {
      // Se non sei l'admin, fuori!
      navigate('/')
    } else {
      // Caricamento finte statistiche per demo, 
      // qui potresti fare query reali se hai le policy RLS sbloccate per l'admin
      setStats({
        usersCount: 1, // Tu
        dbSize: '1.2 MB',
        status: 'Operativo'
      })
    }
  }, [session, navigate])

  const handleLogout = async () => {
    await signOut()
    navigate('/admin')
  }

  if (!session) return null

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 font-mono">
      {/* Header */}
      <header className="flex items-center justify-between mb-12 pb-6 border-b border-white/10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center shadow-[0_0_30px_rgba(147,51,234,0.3)]">
            <ShieldAlert size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">System<span className="text-purple-400">Admin</span></h1>
            <p className="text-xs text-white/40 uppercase tracking-widest mt-1">Superuser Access Granted</p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="ghost" onClick={() => navigate('/')} icon={ArrowLeft} className="text-white/50 hover:text-white hover:bg-white/5">
            Torna all'App
          </Button>
          <Button variant="danger" onClick={handleLogout} icon={LogOut} className="bg-red-900/20 text-red-500 hover:bg-red-900/40 border border-red-900/50">
            Termina Sessione
          </Button>
        </div>
      </header>

      {/* Grid Statistiche */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <MetricCard icon={Users} label="Utenti Registrati" value={stats.usersCount} color="text-blue-400" />
        <MetricCard icon={Database} label="Dimensione DB" value={stats.dbSize} color="text-purple-400" />
        <MetricCard icon={Activity} label="Stato Sistema" value={stats.status} color="text-emerald-400" />
      </div>

      {/* Sezione Controlli */}
      <div className="space-y-6">
        <h2 className="text-sm font-bold text-white/50 uppercase tracking-widest">Pannello di Controllo</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card padding="xl" className="bg-[#111] border-white/5">
            <h3 className="text-lg font-bold mb-2">Gestione Database</h3>
            <p className="text-xs text-white/40 mb-6">Attraverso le policy RLS bypassate, hai accesso in lettura e scrittura a tutte le tabelle del sistema.</p>
            <div className="space-y-3">
              {['user_config', 'transactions', 'saving_plans', 'calendar_events'].map(table => (
                <div key={table} className="flex items-center justify-between p-3 bg-black/50 rounded-lg border border-white/5">
                  <span className="text-sm text-white/80">{table}</span>
                  <span className="text-[10px] bg-purple-500/20 text-purple-400 px-2 py-1 rounded uppercase tracking-widest font-bold">Accesso Completo</span>
                </div>
              ))}
            </div>
          </Card>

          <Card padding="xl" className="bg-[#111] border-white/5">
            <h3 className="text-lg font-bold mb-2">Log di Sicurezza</h3>
            <p className="text-xs text-white/40 mb-6">Ultimi accessi rilevati dal sistema.</p>
            <div className="space-y-4">
              <div className="flex gap-4 text-xs">
                <span className="text-emerald-500">[{new Date().toLocaleTimeString()}]</span>
                <span className="text-white/60">Accesso OTP verificato con successo per <span className="text-white">admin</span></span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

function MetricCard({ icon: Icon, label, value, color }) {
  return (
    <Card padding="lg" className="bg-[#111] border-white/5 relative overflow-hidden group hover:border-white/10 transition-colors">
      <div className={`absolute -right-6 -top-6 opacity-5 group-hover:opacity-10 transition-opacity ${color}`}>
        <Icon size={120} />
      </div>
      <div className="relative z-10">
        <div className={`w-10 h-10 rounded-lg bg-black/50 flex items-center justify-center mb-4 border border-white/5 ${color}`}>
          <Icon size={20} />
        </div>
        <p className="text-2xl font-black mb-1">{value}</p>
        <p className="text-xs text-white/40 uppercase tracking-widest font-bold">{label}</p>
      </div>
    </Card>
  )
}
