import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ShieldAlert, Users, Database, Activity, LogOut, 
  ArrowLeft, Trash2, RefreshCcw, Mail, ShieldCheck,
  AlertTriangle, Loader2
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/useAuthStore'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { toast } from 'sonner'
import { useConfirmStore } from '@/store/useConfirmStore'

export default function AdminDashboard() {
  const confirm = useConfirmStore(s => s.confirm)
  const navigate = useNavigate()
  const { session, signOut } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    usersCount: 0,
    dbSize: '...',
    status: 'Operativo'
  })
  const [users, setUsers] = useState([])
  const [logs, setLogs] = useState([])

  const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || ''

  const fetchData = async () => {
    const isAuthed = session && session.user.email === ADMIN_EMAIL
    if (!isAuthed) return

    setLoading(true)
    try {
      // 1. Fetch Stats (User count & DB size via RPC)
      const { count: userCount } = await supabase.from('user_config').select('*', { count: 'exact', head: true })
      const { data: dbSize } = await supabase.rpc('get_database_size')
      
      setStats({
        usersCount: userCount || 0,
        dbSize: dbSize || 'N/A',
        status: 'Operativo'
      })

      // 2. Fetch Users list
      const { data: userData } = await supabase
        .from('user_config')
        .select('id, first_name, last_name, created_at')
        .order('created_at', { ascending: false })
      
      setUsers(userData || [])

      // 3. Fetch Real Logs
      const { data: logData } = await supabase
        .from('admin_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)
      
      setLogs(logData || [])

    } catch (err) {
      console.error('Errore caricamento admin:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const isAuthed = session && session.user.email === ADMIN_EMAIL
    if (!isAuthed) {
      navigate('/')
    } else {
      fetchData()
    }
  }, [session])

  // --- AZIONI ---

  const handleResetUserData = async (userId, userName) => {
    const ok = await confirm({
      title: 'Reset Dati Utente',
      message: `Sei sicuro di voler resettare TUTTI i dati di ${userName}? Questa azione è irreversibile.`,
      variant: 'warning',
      confirmText: 'Resetta',
      cancelText: 'Annulla'
    })
    if (!ok) return
    
    try {
      const { error } = await supabase.rpc('admin_reset_user_data', { target_user_id: userId })
      if (error) throw error
      toast.success(`Dati di ${userName} resettati con successo`)
      fetchData()
    } catch (err) {
      toast.error('Errore durante il reset dei dati')
    }
  }

  const handleDeleteUser = async (userId, userName) => {
    const ok = await confirm({
      title: 'CANCELLAZIONE TOTALE UTENTE',
      message: `ELIMINAZIONE TOTALE: Vuoi cancellare definitivamente ${userName} e tutti i suoi dati dal sistema?`,
      variant: 'danger',
      confirmText: 'Elimina Utente',
      cancelText: 'Annulla'
    })
    if (!ok) return
    
    try {
      // Nota: Eliminare un utente da auth richiede permessi speciali o una RPC dedicata
      // Per ora resettiamo i dati e mostriamo l'intenzione
      toast.info('Funzione di eliminazione account auth in fase di attivazione su Supabase...')
    } catch (err) {
      toast.error('Errore durante l\'eliminazione')
    }
  }

  const handleSendMagicLink = async (email) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({ email })
      if (error) throw error
      toast.success(`Magic link inviato a ${email}`)
    } catch (err) {
      toast.error('Errore nell\'invio del link')
    }
  }

  const handleLogout = async () => {
    await signOut()
    navigate('/admin')
  }

  if (!session) return null

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] p-6 md:p-12 overflow-y-auto custom-scrollbar">
      <div className="max-w-6xl mx-auto space-y-8 pb-20">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[var(--color-primary-ghost)] text-[var(--color-primary)] rounded-xl flex items-center justify-center">
              <ShieldAlert size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">System Admin</h1>
              <p className="text-xs text-[var(--text-muted)] font-medium mt-0.5">Controllo Totale VitaOS</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="subtle" onClick={() => navigate('/')} icon={ArrowLeft}>
              Torna all'App
            </Button>
            <Button variant="danger" onClick={handleLogout} icon={LogOut}>
              Esci
            </Button>
          </div>
        </header>

        {/* Grid Statistiche */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <MetricCard icon={Users} label="Utenti Attivi" value={stats.usersCount} color="var(--color-info)" />
          <MetricCard icon={Database} label="Dimensione Reale DB" value={stats.dbSize} color="var(--color-primary)" />
          <MetricCard icon={Activity} label="Stato Gateway" value={stats.status} color={stats.status.includes('Limitato') ? 'var(--color-warning)' : 'var(--color-success)'} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* GESTIONE UTENTI (Sostituisce i vecchi riquadri) */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-widest flex items-center gap-2">
              <Users size={16} /> Gestione Account
            </h2>
            <Card padding="none" className="overflow-hidden border-[var(--border-subtle)]">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-[var(--bg-elevated)] border-b border-[var(--border-subtle)]">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold text-[var(--text-muted)] uppercase">Utente</th>
                      <th className="px-6 py-4 text-xs font-bold text-[var(--text-muted)] uppercase">Registrato</th>
                      <th className="px-6 py-4 text-xs font-bold text-[var(--text-muted)] uppercase text-right">Azioni</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-subtle)]">
                    {loading ? (
                      <tr>
                        <td colSpan="3" className="px-6 py-12 text-center text-[var(--text-muted)]">
                          <Loader2 className="animate-spin mx-auto mb-2" size={24} />
                          Sincronizzazione dati...
                        </td>
                      </tr>
                    ) : users.length === 0 ? (
                      <tr>
                        <td colSpan="3" className="px-6 py-12 text-center text-[var(--text-muted)]">
                          Nessun utente trovato nel database.
                        </td>
                      </tr>
                    ) : (
                      users.map((u) => (
                        <tr key={u.id} className="hover:bg-[var(--bg-surface)] transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="font-bold text-sm">{u.first_name} {u.last_name}</span>
                              <span className="text-[10px] font-mono text-[var(--text-muted)]">{u.id}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-xs text-[var(--text-muted)]">
                            {new Date(u.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button 
                                onClick={() => handleResetUserData(u.id, u.first_name)}
                                title="Resetta dati tabelle"
                                className="p-2 text-[var(--text-muted)] hover:text-[var(--color-warning)] hover:bg-[var(--color-warning-ghost)] rounded-lg transition-colors"
                              >
                                <RefreshCcw size={16} />
                              </button>
                              <button 
                                onClick={() => handleDeleteUser(u.id, u.first_name)}
                                title="Elimina Account"
                                className="p-2 text-[var(--text-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-ghost)] rounded-lg transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            <div className="p-4 bg-[var(--color-danger-ghost)] rounded-xl border border-[var(--color-danger-light)]/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="text-[var(--color-danger)]" size={20} />
                <div>
                  <p className="text-sm font-bold text-[var(--color-danger)]">Zona Pericolo: Reset Globale</p>
                  <p className="text-xs text-[var(--color-danger-dark)]">Questa azione cancellerà TUTTE le tabelle di TUTTI gli utenti.</p>
                </div>
              </div>
              <Button variant="danger" size="sm" className="font-black uppercase tracking-tighter">
                Nuclear Reset
              </Button>
            </div>
          </div>

          {/* LOG DI SICUREZZA REALI */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-[var(--text-secondary)] uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck size={16} /> Audit Logs
            </h2>
            <Card padding="lg" className="border-[var(--border-subtle)] bg-[var(--bg-surface)] h-fit">
              <div className="space-y-4">
                {logs.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-xs text-[var(--text-muted)] italic">Nessun log recente...</p>
                  </div>
                ) : (
                  logs.map((log) => (
                    <div key={log.id} className="flex flex-col gap-1 p-3 bg-[var(--bg-elevated)] rounded-lg border border-[var(--border-subtle)] text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-[var(--color-primary)] uppercase tracking-tighter">{log.action}</span>
                        <span className="text-[10px] text-[var(--text-muted)]">{new Date(log.created_at).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-[var(--text-secondary)]">{log.user_email}</p>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </div>

      </div>
    </div>
  )
}

function MetricCard({ icon: Icon, label, value, color }) {
  return (
    <Card padding="lg" className="border-[var(--border-subtle)] shadow-sm relative overflow-hidden group hover:border-[var(--border-default)] transition-colors">
      <div className="absolute -right-6 -top-6 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity" style={{ color }}>
        <Icon size={120} />
      </div>
      <div className="relative z-10">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)`, color }}>
          <Icon size={20} />
        </div>
        <p className="text-2xl font-black mb-1">{value}</p>
        <p className="text-xs text-[var(--text-muted)] uppercase tracking-widest font-bold">{label}</p>
      </div>
    </Card>
  )
}
