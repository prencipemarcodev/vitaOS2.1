import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  Car, Plus, Trash2, Calendar, TrendingUp, Gauge, Droplet, 
  Wrench, Shield, FileText, AlertTriangle, ArrowLeftRight 
} from 'lucide-react'
import { toast } from 'sonner'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import { useConfirmStore } from '@/store/useConfirmStore'

function VehicleSection() {
  const confirm = useConfirmStore(s => s.confirm)
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorNotice, setErrorNotice] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Form State
  const [showAddForm, setShowAddForm] = useState(false)
  const [type, setType] = useState('fuel')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [odometer, setOdometer] = useState('')
  const [liters, setLiters] = useState('')
  const [pricePerLiter, setPricePerLiter] = useState('')
  const [notes, setNotes] = useState('')

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      const { data, error } = await supabase
        .from('vehicle_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        
      if (error) {
        console.error(error)
        if (error.message?.includes('relation "public.vehicle_logs" does not exist') || error.code === '42P01') {
          setErrorNotice(true)
        } else {
          toast.error('Errore nel caricamento dei dati')
        }
      } else {
        setLogs(data || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!amount || isNaN(parseFloat(amount))) {
      toast.error('Inserisci un importo valido')
      return
    }

    setSubmitting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const payload = {
        user_id: user.id,
        date,
        type,
        amount: parseFloat(amount),
        odometer: odometer ? parseInt(odometer) : null,
        liters: type === 'fuel' && liters ? parseFloat(liters) : null,
        price_per_liter: type === 'fuel' && pricePerLiter ? parseFloat(pricePerLiter) : null,
        notes: notes.trim() || null
      }

      const { error } = await supabase.from('vehicle_logs').insert(payload)
      if (error) throw error

      toast.success('Spesa registrata correttamente')
      setShowAddForm(false)
      // Reset Form
      setAmount('')
      setOdometer('')
      setLiters('')
      setPricePerLiter('')
      setNotes('')
      fetchLogs()
    } catch (err) {
      console.error(err)
      toast.error('Errore nel salvataggio della spesa')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    const ok = await confirm({
      title: 'Elimina elemento',
      message: 'Sei sicuro di voler eliminare questo elemento?',
      variant: 'danger',
      confirmText: 'Elimina',
      cancelText: 'Annulla'
    })
    if (!ok) return
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      // Filtro anche per user_id per prevenire IDOR (VUL-003)
      const { error } = await supabase.from('vehicle_logs').delete().eq('id', id).eq('user_id', user.id)
      if (error) throw error
      toast.success('Elemento eliminato')
      fetchLogs()
    } catch (err) {
      console.error(err)
      toast.error("Errore durante l'eliminazione")
    }
  }

  // Calcoli delle statistiche
  const stats = useMemo(() => {
    const fuelLogs = logs.filter(l => l.type === 'fuel' && l.odometer && l.liters).sort((a, b) => a.odometer - b.odometer)
    const odometers = logs.map(l => l.odometer).filter(o => o && o > 0)
    
    const maxOdo = odometers.length > 0 ? Math.max(...odometers) : 0
    const minOdo = odometers.length > 0 ? Math.min(...odometers) : 0
    const totalKms = maxOdo - minOdo

    let avgConsumption = 0
    let costPerKm = 0

    // Consumo Medio: servono almeno 2 rifornimenti completi per calcolare la differenza km
    if (fuelLogs.length >= 2) {
      const fuelKms = fuelLogs[fuelLogs.length - 1].odometer - fuelLogs[0].odometer
      // Somma i litri di tutti i rifornimenti escludendo il primo baseline
      const totalLiters = fuelLogs.slice(1).reduce((sum, l) => sum + parseFloat(l.liters || 0), 0)
      if (fuelKms > 0) {
        avgConsumption = (totalLiters / fuelKms) * 100
      }
    }

    // Costo Kilometrico su tutte le spese
    const totalSpent = logs.reduce((sum, l) => sum + parseFloat(l.amount || 0), 0)
    if (totalKms > 0) {
      costPerKm = totalSpent / totalKms
    }

    return {
      maxOdo,
      avgConsumption,
      costPerKm,
      totalSpent
    }
  }, [logs])

  // Trova scadenze future
  const deadlines = useMemo(() => {
    return logs
      .filter(l => (l.type === 'insurance' || l.type === 'tax') && new Date(l.date) >= new Date())
      .sort((a, b) => new Date(a.date) - new Date(b.date))
  }, [logs])

  if (errorNotice) {
    return (
      <Card padding="lg" className="border-red-500/20 bg-red-500/5">
        <div className="flex items-center gap-3 text-red-500 mb-4">
          <AlertTriangle size={24} />
          <h3 className="text-lg font-black">Tabella Veicolo non configurata</h3>
        </div>
        <p className="text-sm text-[var(--text-muted)] mb-5 leading-relaxed">
          La tabella di tracciamento dell'auto non è ancora presente nel tuo database Supabase. 
          Per sbloccare questo modulo, copia ed esegui le istruzioni presenti nel file di migrazione 
          <code className="mx-1 px-1.5 py-0.5 bg-black/10 dark:bg-white/10 rounded font-mono text-xs">create_addons_tables.sql</code> 
          (situato nella root del tuo progetto) all'interno del <strong>SQL Editor</strong> della tua Dashboard Supabase.
        </p>
        <div className="bg-[var(--bg-surface)] p-4 rounded-xl border border-[var(--border-subtle)]">
          <p className="text-xs font-bold mb-2">Procedura veloce:</p>
          <ol className="text-xs text-[var(--text-secondary)] space-y-1 list-decimal pl-4">
            <li>Apri il file <code className="font-mono">create_addons_tables.sql</code> ed apri la console Supabase.</li>
            <li>Incolla lo script nel SQL Editor ed esegui.</li>
            <li>Ricarica questa pagina.</li>
          </ol>
        </div>
      </Card>
    )
  }

  const getTypeBadge = (type) => {
    switch (type) {
      case 'fuel':
        return { label: 'Rifornimento', icon: Droplet, color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' }
      case 'maintenance':
        return { label: 'Manutenzione', icon: Wrench, color: 'text-orange-500 bg-orange-500/10 border-orange-500/20' }
      case 'insurance':
        return { label: 'Assicurazione', icon: Shield, color: 'text-green-500 bg-green-500/10 border-green-500/20' }
      case 'tax':
        return { label: 'Bollo Auto', icon: FileText, color: 'text-purple-500 bg-purple-500/10 border-purple-500/20' }
      default:
        return { label: 'Altro', icon: Car, color: 'text-gray-500 bg-gray-500/10 border-gray-500/20' }
    }
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card padding="md" className="flex flex-col gap-1 shadow-sm">
          <div className="text-[var(--text-muted)] flex items-center gap-1">
            <Gauge size={14} />
            <span className="text-[10px] font-black uppercase tracking-wider">Km Attuali</span>
          </div>
          <p className="text-xl font-black mt-1 text-[var(--text-primary)]">
            {stats.maxOdo > 0 ? `${stats.maxOdo.toLocaleString()} km` : '—'}
          </p>
        </Card>

        <Card padding="md" className="flex flex-col gap-1 shadow-sm">
          <div className="text-[var(--text-muted)] flex items-center gap-1">
            <Droplet size={14} />
            <span className="text-[10px] font-black uppercase tracking-wider">Consumo</span>
          </div>
          <p className="text-xl font-black mt-1 text-[var(--text-primary)]">
            {stats.avgConsumption > 0 ? `${stats.avgConsumption.toFixed(2)} l/100` : '—'}
          </p>
        </Card>

        <Card padding="md" className="flex flex-col gap-1 shadow-sm">
          <div className="text-[var(--text-muted)] flex items-center gap-1">
            <ArrowLeftRight size={14} />
            <span className="text-[10px] font-black uppercase tracking-wider">Costo / Km</span>
          </div>
          <p className="text-xl font-black mt-1 text-[var(--text-primary)]">
            {stats.costPerKm > 0 ? `${stats.costPerKm.toFixed(3)} €/km` : '—'}
          </p>
        </Card>

        <Card padding="md" className="flex flex-col gap-1 shadow-sm">
          <div className="text-[var(--text-muted)] flex items-center gap-1">
            <TrendingUp size={14} />
            <span className="text-[10px] font-black uppercase tracking-wider">Spesa Totale</span>
          </div>
          <p className="text-xl font-black mt-1 text-[var(--text-primary)]">
            {stats.totalSpent > 0 ? `€ ${stats.totalSpent.toFixed(2)}` : '—'}
          </p>
        </Card>
      </div>

      {/* Main Grid */}
      <div className="grid md:grid-cols-3 gap-6 items-start">
        {/* Left column: Add form or Deadlines */}
        <div className="md:col-span-1 space-y-6">
          <Card padding="md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)]">Inserisci Spesa</h3>
              {!showAddForm && (
                <Button size="xs" variant="primary" icon={Plus} onClick={() => setShowAddForm(true)}>Aggiungi</Button>
              )}
            </div>

            {showAddForm ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-[var(--text-muted)]">Tipo di Spesa</label>
                  <select 
                    value={type} 
                    onChange={e => setType(e.target.value)}
                    className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                  >
                    <option value="fuel">⛽ Rifornimento Carburante</option>
                    <option value="maintenance">🔧 Manutenzione / Officina</option>
                    <option value="insurance">🛡️ Assicurazione</option>
                    <option value="tax">📄 Bollo Auto</option>
                    <option value="other">🚗 Altro / Parcheggio / Lavaggio</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-[var(--text-muted)]">Data</label>
                  <input 
                    type="date" 
                    value={date} 
                    onChange={e => setDate(e.target.value)}
                    required
                    className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-[var(--text-muted)]">Importo (€)</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      placeholder="0.00" 
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      required
                      className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-[var(--text-muted)]">Odometro (km)</label>
                    <input 
                      type="number" 
                      placeholder="Es: 125000" 
                      value={odometer}
                      onChange={e => setOdometer(e.target.value)}
                      className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                    />
                  </div>
                </div>

                {type === 'fuel' && (
                  <div className="grid grid-cols-2 gap-2 p-3 bg-[var(--bg-base)] rounded-xl border border-[var(--border-subtle)]">
                    <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase text-[var(--text-muted)]">Litri erogati</label>
                      <input 
                        type="number" 
                        step="0.01" 
                        placeholder="0.00" 
                        value={liters}
                        onChange={e => setLiters(e.target.value)}
                        className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase text-[var(--text-muted)]">Prezzo (€/l)</label>
                      <input 
                        type="number" 
                        step="0.001" 
                        placeholder="1.750" 
                        value={pricePerLiter}
                        onChange={e => setPricePerLiter(e.target.value)}
                        className="w-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-[var(--text-muted)]">Note</label>
                  <textarea 
                    rows={2} 
                    placeholder="Dettagli spesa..." 
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] resize-none"
                  />
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <Button type="button" variant="ghost" size="xs" onClick={() => setShowAddForm(false)}>Annulla</Button>
                  <Button type="submit" variant="primary" size="xs" disabled={submitting}>
                    {submitting ? 'Salvo...' : 'Salva'}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="text-center py-6 text-[var(--text-muted)]">
                <Car size={32} className="mx-auto mb-2 opacity-25" />
                <p className="text-xs font-bold opacity-50">Inserisci rifornimenti e spese per sbloccare la telemetria.</p>
              </div>
            )}
          </Card>

          {deadlines.length > 0 && (
            <Card padding="md" className="border-yellow-500/10 bg-yellow-500/5">
              <h3 className="text-xs font-black uppercase tracking-widest text-yellow-600 mb-3 flex items-center gap-1.5">
                <AlertTriangle size={14} />
                Scadenze Future
              </h3>
              <div className="space-y-2">
                {deadlines.map(d => {
                  const badge = getTypeBadge(d.type)
                  return (
                    <div key={d.id} className="flex justify-between items-center text-xs bg-[var(--bg-surface)] p-2.5 rounded-lg border border-[var(--border-subtle)]">
                      <div>
                        <p className="font-bold text-[var(--text-primary)]">{badge.label}</p>
                        <p className="text-[10px] text-[var(--text-muted)]">{format(new Date(d.date), 'dd MMMM yyyy', { locale: it })}</p>
                      </div>
                      <span className="font-black text-[var(--text-primary)]">€ {parseFloat(d.amount).toFixed(2)}</span>
                    </div>
                  )
                })}
              </div>
            </Card>
          )}
        </div>

        {/* Right column: Logs list */}
        <div className="md:col-span-2 space-y-4">
          <Card padding="md">
            <h3 className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)] mb-4">Registro Spese & Consumi</h3>
            
            {loading ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <div className="w-6 h-6 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-[var(--text-muted)]">Caricamento...</p>
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-12 text-[var(--text-muted)]">
                <p className="text-sm font-bold opacity-50">Nessun movimento registrato.</p>
              </div>
            ) : (
              <div className="divide-y divide-[var(--border-subtle)] overflow-hidden">
                {logs.map(log => {
                  const badge = getTypeBadge(log.type)
                  const Icon = badge.icon
                  
                  return (
                    <div key={log.id} className="flex items-center justify-between py-3 group">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${badge.color}`}>
                          <Icon size={16} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[var(--text-primary)] truncate">
                              {badge.label}
                            </span>
                            {log.odometer && (
                              <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded text-[var(--text-muted)]">
                                {log.odometer.toLocaleString()} km
                              </span>
                            )}
                          </div>
                          
                          <div className="flex gap-2 items-center text-[10px] text-[var(--text-muted)] mt-0.5">
                            <span>{format(new Date(log.date), 'dd/MM/yyyy')}</span>
                            {log.notes && (
                              <>
                                <span>•</span>
                                <span className="truncate italic">"{log.notes}"</span>
                              </>
                            )}
                            {log.type === 'fuel' && log.liters && (
                              <>
                                <span>•</span>
                                <span className="font-semibold text-blue-500">{parseFloat(log.liters).toFixed(2)} Litri</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-sm font-black text-[var(--text-primary)]">
                          € {parseFloat(log.amount).toFixed(2)}
                        </span>
                        <button 
                          onClick={() => handleDelete(log.id)}
                          className="p-1 text-[var(--text-muted)] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}

export default VehicleSection
