import { useState, useEffect, useMemo } from 'react'
import Modal from '@/components/ui/Modal'
import { supabase } from '@/lib/supabase'
import { 
  Plus, Trash2, Calendar, Shield, CreditCard, ToggleLeft, ToggleRight,
  TrendingDown, RefreshCw, AlertTriangle, AlertCircle, Play, Music, Cloud, Laptop, Box
} from 'lucide-react'
import { toast } from 'sonner'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { format, differenceInDays } from 'date-fns'
import { it } from 'date-fns/locale'
import { useConfirmStore } from '@/store/useConfirmStore'

function SubscriptionManager({ showAddForm, setShowAddForm }) {
  const confirm = useConfirmStore(s => s.confirm)
  const [subs, setSubs] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorNotice, setErrorNotice] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Form State
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [billingPeriod, setBillingPeriod] = useState('monthly')
  const [nextRenewalDate, setNextRenewalDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [paymentMethod, setPaymentMethod] = useState('card')
  const [notifyBeforeDays, setNotifyBeforeDays] = useState(3)

  const fetchSubscriptions = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('next_renewal_date', { ascending: true })

      if (error) {
        console.error(error)
        if (error.message?.includes('relation "public.subscriptions" does not exist') || error.code === '42P01') {
          setErrorNotice(true)
        } else {
          toast.error('Errore nel caricamento degli abbonamenti')
        }
      } else {
        setSubs(data || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSubscriptions()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Inserisci il nome dell\'abbonamento')
      return
    }
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
        name: name.trim(),
        amount: parseFloat(amount),
        billing_period: billingPeriod,
        next_renewal_date: nextRenewalDate,
        payment_method: paymentMethod,
        notify_before_days: parseInt(notifyBeforeDays),
        is_active: true
      }

      const { error } = await supabase.from('subscriptions').insert(payload)
      if (error) throw error

      toast.success('Abbonamento salvato correttamente')
      setShowAddForm(false)
      // Reset form
      setName('')
      setAmount('')
      setBillingPeriod('monthly')
      setNextRenewalDate(format(new Date(), 'yyyy-MM-dd'))
      setPaymentMethod('card')
      setNotifyBeforeDays(3)
      
      fetchSubscriptions()
    } catch (err) {
      console.error(err)
      toast.error('Errore nel salvataggio dell\'abbonamento')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    const ok = await confirm({
      title: 'Elimina abbonamento',
      message: 'Vuoi davvero eliminare questo abbonamento?',
      variant: 'danger',
      confirmText: 'Elimina',
      cancelText: 'Annulla'
    })
    if (!ok) return
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      // Filtro anche per user_id per prevenire IDOR (VUL-003)
      const { error } = await supabase.from('subscriptions').delete().eq('id', id).eq('user_id', user.id)
      if (error) throw error
      toast.success('Abbonamento eliminato')
      fetchSubscriptions()
    } catch (err) {
      console.error(err)
      toast.error('Errore durante l\'eliminazione')
    }
  }

  const toggleActive = async (sub) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      // Filtro anche per user_id per prevenire IDOR (VUL-003)
      const { error } = await supabase
        .from('subscriptions')
        .update({ is_active: !sub.is_active })
        .eq('id', sub.id)
        .eq('user_id', user.id)

      if (error) throw error
      toast.success(`Abbonamento ${!sub.is_active ? 'attivato' : 'disattivato'}`)
      fetchSubscriptions()
    } catch (err) {
      console.error(err)
      toast.error('Errore nell\'aggiornamento dello stato')
    }
  }

  // Statistiche e calcoli
  const stats = useMemo(() => {
    const activeSubs = subs.filter(s => s.is_active)
    
    // Calcola spesa mensile equivalente
    const monthlyTotal = activeSubs.reduce((sum, s) => {
      const amt = parseFloat(s.amount)
      return sum + (s.billing_period === 'yearly' ? amt / 12 : amt)
    }, 0)

    // Trova l'abbonamento con il rinnovo più vicino
    const upcoming = activeSubs.length > 0 ? activeSubs[0] : null
    
    return {
      activeCount: activeSubs.length,
      monthlyTotal,
      yearlyTotal: monthlyTotal * 12,
      upcoming
    }
  }, [subs])

  // Icone e colori personalizzati per i brand riconosciuti
  const getBrandDetails = (subName) => {
    const lowerName = subName.toLowerCase()
    if (lowerName.includes('spotify')) {
      return { icon: Music, color: 'text-green-500 bg-green-500/10 border-green-500/20' }
    }
    if (lowerName.includes('netflix') || lowerName.includes('prime video') || lowerName.includes('disney')) {
      return { icon: Play, color: 'text-red-500 bg-red-500/10 border-red-500/20' }
    }
    if (lowerName.includes('icloud') || lowerName.includes('google') || lowerName.includes('drive') || lowerName.includes('dropbox')) {
      return { icon: Cloud, color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' }
    }
    if (lowerName.includes('amazon') || lowerName.includes('prime')) {
      return { icon: Box, color: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20' }
    }
    if (lowerName.includes('office') || lowerName.includes('adobe') || lowerName.includes('figma') || lowerName.includes('chatgpt')) {
      return { icon: Laptop, color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20' }
    }
    return { icon: CreditCard, color: 'text-gray-500 bg-gray-500/10 border-gray-500/20' }
  }

  if (errorNotice) {
    return (
      <Card padding="lg" className="border-red-500/20 bg-red-500/5">
        <div className="flex items-center gap-3 text-red-500 mb-4">
          <AlertTriangle size={24} />
          <h3 className="text-lg font-black">Tabella Abbonamenti non configurata</h3>
        </div>
        <p className="text-sm text-[var(--text-muted)] mb-5 leading-relaxed">
          La tabella di gestione degli abbonamenti non è ancora presente nel tuo database.
          Per sbloccare questo modulo, copia ed esegui le istruzioni presenti nel file di migrazione
          <code className="mx-1 px-1.5 py-0.5 bg-black/10 dark:bg-white/10 rounded font-mono text-xs">create_addons_tables.sql</code>
          (situato nella root del tuo progetto) all'interno del <strong>SQL Editor</strong> della tua Dashboard Supabase.
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Dashboard KPI Abbonamenti */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card padding="md" className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-[var(--color-primary-ghost)] flex items-center justify-center text-[var(--color-primary)]">
            <RefreshCw size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)]">Abbonamenti Attivi</p>
            <p className="text-2xl font-black text-[var(--text-primary)] mt-0.5">{stats.activeCount}</p>
          </div>
        </Card>

        <Card padding="md" className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
            <TrendingDown size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)]">Costo Mensile Stimato</p>
            <p className="text-2xl font-black text-[var(--text-primary)] mt-0.5">€ {stats.monthlyTotal.toFixed(2)}</p>
          </div>
        </Card>

        <Card padding="md" className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500">
            <AlertCircle size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)]">Prossimo Rinnovo</p>
            <p className="text-sm font-bold text-[var(--text-primary)] mt-0.5 truncate">
              {stats.upcoming 
                ? `${stats.upcoming.name} (${format(new Date(stats.upcoming.next_renewal_date), 'dd/MM')})`
                : 'Nessuno imminente'
              }
            </p>
          </div>
        </Card>
      </div>

      {/* Lista degli Abbonamenti — adattata a larghezza intera */}
      <div className="w-full">
        <Card padding="md">
          <h3 className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)] mb-4">Abbonamenti</h3>
          
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <div className="w-6 h-6 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-[var(--text-muted)]">Caricamento in corso...</p>
            </div>
          ) : subs.length === 0 ? (
            <div className="text-center py-12 text-[var(--text-muted)]">
              <p className="text-sm font-bold opacity-50">Nessun abbonamento salvato.</p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border-subtle)]">
              {subs.map(sub => {
                const brand = getBrandDetails(sub.name)
                const Icon = brand.icon
                
                // Calcola i giorni mancanti al rinnovo
                const daysLeft = differenceInDays(new Date(sub.next_renewal_date), new Date())
                const isUrgent = daysLeft >= 0 && daysLeft <= sub.notify_before_days

                return (
                  <div key={sub.id} className={`flex items-center justify-between py-3.5 group transition-opacity ${!sub.is_active ? 'opacity-40' : ''}`}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border transition-all ${brand.color}`}>
                        <Icon size={16} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[var(--text-primary)] truncate">{sub.name}</span>
                          <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded text-[var(--text-muted)]">
                            {sub.billing_period === 'yearly' ? 'Annuale' : 'Mensile'}
                          </span>
                        </div>
                        <div className="flex gap-2 items-center text-[10px] mt-0.5">
                          <span className="text-[var(--text-muted)]">
                            Rinnovo: {format(new Date(sub.next_renewal_date), 'dd MMMM yyyy', { locale: it })}
                          </span>
                          
                          {sub.is_active && daysLeft >= 0 && (
                            <>
                              <span className="text-[var(--text-muted)]">•</span>
                              <span className={`font-black ${isUrgent ? 'text-red-500 font-extrabold animate-pulse' : 'text-blue-500'}`}>
                                {daysLeft === 0 ? 'Oggi' : daysLeft === 1 ? 'Domani' : `tra ${daysLeft} gg`}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="text-sm font-black text-[var(--text-primary)]">€ {parseFloat(sub.amount).toFixed(2)}</p>
                        <p className="text-[8px] text-[var(--text-muted)] font-black uppercase">
                          {sub.payment_method === 'bank' ? 'Addebito Conto' : 'Carta'}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => toggleActive(sub)}
                          className="p-1 hover:text-[var(--color-primary)] transition-colors"
                        >
                          {sub.is_active ? (
                            <ToggleRight className="text-[var(--color-primary)]" size={20} />
                          ) : (
                            <ToggleLeft className="text-[var(--text-muted)]" size={20} />
                          )}
                        </button>
                        
                        <button
                          onClick={() => handleDelete(sub.id)}
                          className="p-1 text-[var(--text-muted)] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Modal Aggiungi Abbonamento */}
      <Modal
        isOpen={showAddForm}
        onClose={() => setShowAddForm(false)}
        title="Aggiungi Abbonamento"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[var(--text-secondary)]">Nome Servizio</label>
            <input
              type="text"
              required
              placeholder="Es: Netflix, Spotify, iCloud..."
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-ghost)]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--text-secondary)]">Importo (€)</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="9.99"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-ghost)]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--text-secondary)]">Frequenza</label>
              <select
                value={billingPeriod}
                onChange={e => setBillingPeriod(e.target.value)}
                className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-ghost)]"
              >
                <option value="monthly">Mensile</option>
                <option value="yearly">Annuale</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[var(--text-secondary)]">Prossimo Rinnovo</label>
            <input
              type="date"
              required
              value={nextRenewalDate}
              onChange={e => setNextRenewalDate(e.target.value)}
              className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-ghost)]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--text-secondary)]">Pagamento</label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value)}
                className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-ghost)]"
              >
                <option value="card">💳 Carta</option>
                <option value="bank">🏦 Addebito Conto</option>
                <option value="cash">💵 Contanti</option>
                <option value="other">⚙️ Altro</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--text-secondary)]">Alert (giorni prima)</label>
              <input
                type="number"
                min="1"
                max="15"
                value={notifyBeforeDays}
                onChange={e => setNotifyBeforeDays(e.target.value)}
                className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-ghost)]"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-4">
            <Button
              type="submit"
              variant="primary"
              loading={submitting}
              size="lg"
              className="w-full shadow-lg font-black tracking-wide"
            >
              Aggiungi Abbonamento
            </Button>
            <Button type="button" variant="ghost" onClick={() => setShowAddForm(false)} className="w-full text-[var(--text-muted)] font-bold">
              Annulla
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default SubscriptionManager
