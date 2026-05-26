import { useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAppStore } from '@/store/useAppStore'
import { useCalendarStore } from '@/store/useCalendarStore'
import { useFinanceStore } from '@/store/useFinanceStore'
import { useFirmeStore } from '@/store/useFirmeStore'
import { useHealthStore } from '@/store/useHealthStore'
import { useNoteStore } from '@/store/useNoteStore'
import { useSavingsStore } from '@/store/useSavingsStore'
import { useTaskStore } from '@/store/useTaskStore'
import { startOfMonth, endOfMonth, format } from 'date-fns'
import { getAccounts } from '@/lib/accounts'

/**
 * useSupabaseSync — carica i dati iniziali da Supabase e li sincronizza negli store.
 * Viene montato una volta in App.jsx.
 *
 * SICUREZZA: ogni query è filtrata per user_id in modo da garantire
 * che ogni utente veda SOLO i propri dati.
 * La protezione definitiva è l'RLS abilitato su Supabase (lato database),
 * questo filtro client-side è un ulteriore strato di sicurezza.
 */
export function useSupabaseSync() {
  const { selectedMonth, setUserConfig, setOnboardingCompleted } = useAppStore()
  const { setEvents, setAbsences, setRecurringEvents, setSubscriptions, setLoading: setCalLoading } = useCalendarStore()
  const { setTasks } = useTaskStore()
  const { setTransactions, setCategories, setCumulativeBalance, setHistoricalTransactions, addTransaction, setLoading: setFinLoading } = useFinanceStore()
  const { setSessions, setLoading: setFirmeLoading } = useFirmeStore()
  const { setWorkoutSessions, setWeightLog, setGymSchedules, setSleepLog, setWaterLog, setLoading: setHealthLoading } = useHealthStore()
  const { setNotes, setLoading: setNoteLoading } = useNoteStore()
  const { setPlans, setMovements, setLoading: setSavLoading } = useSavingsStore()

  const monthDate = new Date(selectedMonth)
  const monthStart = format(startOfMonth(monthDate), 'yyyy-MM-dd')
  const monthEnd = format(endOfMonth(monthDate), 'yyyy-MM-dd')

  /**
   * Helper: restituisce l'utente autenticato corrente.
   * Se non c'è sessione attiva, ritorna null.
   */
  const getAuthUser = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    return user ?? null
  }, [])

  // ── Load user config ──
  const loadUserConfig = useCallback(async () => {
    try {
      const user = await getAuthUser()
      if (!user) return

      let { data, error } = await supabase
        .from('user_config')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle() // Usa maybeSingle per evitare errori 406/PGRST116 se non trova nulla

      // Se c'è un errore o se la riga non esiste, proviamo a crearla
      if (error || !data) {
        console.log('Profilo non trovato o errore (', error?.code, '), creazione in corso...')
        const { data: newData, error: insertError } = await supabase
          .from('user_config')
          .insert({ 
            user_id: user.id,
            onboarding_completed: false,
            onboarding_step: 0
          })
          .select()
          .maybeSingle()
        
        if (!insertError) data = newData
      }

      if (data) {
        setUserConfig(data)
        setOnboardingCompleted(data.onboarding_completed || false)
      }
    } catch (err) {
      console.error('Errore critico durante sync config:', err)
    }
  }, [getAuthUser, setUserConfig, setOnboardingCompleted])

  // ── Load calendar events for the month ──
  const loadCalendar = useCallback(async () => {
    const user = await getAuthUser()
    if (!user) return
    setCalLoading(true)
    const [eventsRes, absencesRes, recurringRes, tasksRes, subsRes] = await Promise.all([
      supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', monthStart)
        .lte('date', monthEnd)
        .order('date'),
      supabase
        .from('absences')
        .select('*')
        .eq('user_id', user.id)
        .or(`start_date.lte.${monthEnd},end_date.gte.${monthStart}`)
        .order('start_date'),
      supabase
        .from('recurring_events')
        .select('*')
        .eq('user_id', user.id)
        .order('month,day'),
      supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', monthStart)
        .lte('date', monthEnd)
        .order('created_at', { ascending: false }),
      supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
    ])
    if (eventsRes.data) setEvents(eventsRes.data)
    if (absencesRes.data) setAbsences(absencesRes.data)
    if (recurringRes.data) setRecurringEvents(recurringRes.data)
    if (tasksRes.data) setTasks(tasksRes.data)
    if (subsRes.data) setSubscriptions(subsRes.data)
    setCalLoading(false)
  }, [getAuthUser, monthStart, monthEnd, setEvents, setAbsences, setRecurringEvents, setTasks, setSubscriptions, setCalLoading])

  // ── Load finance data for the month ──
  const loadFinance = useCallback(async () => {
    const user = await getAuthUser()
    if (!user) return
    setFinLoading(true)
    const [txRes, catRes, cumulativeRes] = await Promise.all([
      supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', monthStart)
        .lte('date', monthEnd)
        .order('date', { ascending: false }),
      supabase
        .from('finance_categories')
        .select('*')
        .or(`user_id.eq.${user.id},user_id.is.null`)
        .order('is_default', { ascending: false }),
      supabase
        .from('transactions')
        .select('amount, type, date')
        .eq('user_id', user.id)
        .lte('date', monthEnd)
    ])
    
    let currentTransactions = txRes.data || []
    
    if (txRes.data) setTransactions(txRes.data)
    if (catRes.data) setCategories(catRes.data)
    
    let hasGeneratedTxs = false
    
    // Generazione automatica transazioni periodiche
    if (catRes.data && txRes.data) {
      const periodicCats = catRes.data.filter(c => c.is_periodic && parseFloat(c.periodic_amount || 0) > 0)
      const newTxs = []
      
      for (const cat of periodicCats) {
        const alreadyExists = currentTransactions.some(t => t.category?.toString() === cat.id?.toString())
        if (!alreadyExists) {
          const lastDay = endOfMonth(monthDate).getDate()
          const targetDay = Math.min(cat.periodic_day || 1, lastDay)
          const txDate = format(new Date(monthDate.getFullYear(), monthDate.getMonth(), targetDay), 'yyyy-MM-dd')
          
          newTxs.push({
            user_id: user.id,
            date: txDate,
            amount: parseFloat(cat.periodic_amount),
            type: cat.type || 'expense',
            category: cat.id,
            description: `Rinnovo automatico ${cat.name}`,
            is_planned: false,
            is_recurring: true
          })
        }
      }

      if (newTxs.length > 0) {
        const { data: inserted, error: insertErr } = await supabase.from('transactions').insert(newTxs).select()
        if (!insertErr && inserted) {
          hasGeneratedTxs = true
          inserted.forEach(tx => addTransaction(tx))
          currentTransactions = [...inserted, ...currentTransactions]
          
          // Ricarica transazioni cumulative per aggiornare il saldo
          const allTxsRes = await supabase
            .from('transactions')
            .select('amount, type, date')
            .eq('user_id', user.id)
            .lte('date', monthEnd)
          if (allTxsRes.data) {
            setHistoricalTransactions(allTxsRes.data)
            const userConfig = useAppStore.getState().userConfig
            const accounts = getAccounts(userConfig)
            const baseBalance = accounts.reduce((sum, acc) => sum + parseFloat(acc.initial_balance || 0), 0)
            const inc = allTxsRes.data.filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount || 0), 0)
            const exp = allTxsRes.data.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount || 0), 0)
            setCumulativeBalance(baseBalance + inc - exp)
          }
        }
      }
    }

    if (cumulativeRes.data && !hasGeneratedTxs) {
      setHistoricalTransactions(cumulativeRes.data)
      const userConfig = useAppStore.getState().userConfig
      const accounts = getAccounts(userConfig)
      const baseBalance = accounts.reduce((sum, acc) => sum + parseFloat(acc.initial_balance || 0), 0)
      const inc = cumulativeRes.data.filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount || 0), 0)
      const exp = cumulativeRes.data.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount || 0), 0)
      setCumulativeBalance(baseBalance + inc - exp)
    }
    setFinLoading(false)
  }, [getAuthUser, monthStart, monthEnd, setTransactions, setCategories, setCumulativeBalance, setHistoricalTransactions, addTransaction, setFinLoading])

  // ── Load work sessions for the month ──
  const loadFirme = useCallback(async () => {
    const user = await getAuthUser()
    if (!user) return
    setFirmeLoading(true)
    const { data } = await supabase
      .from('work_sessions')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', monthStart)
      .lte('date', monthEnd)
      .order('date', { ascending: false })
    if (data) setSessions(data)
    setFirmeLoading(false)
  }, [getAuthUser, monthStart, monthEnd, setSessions, setFirmeLoading])

  // ── Load health data ──
  const loadHealth = useCallback(async () => {
    const user = await getAuthUser()
    if (!user) return
    setHealthLoading(true)
    const [workoutsRes, weightRes, gymRes] = await Promise.all([
      supabase
        .from('workout_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(100),
      supabase
        .from('weight_log')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(90),
      supabase
        .from('gym_schedules')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at'),
    ])
    if (workoutsRes.data) setWorkoutSessions(workoutsRes.data)
    if (weightRes.data) setWeightLog(weightRes.data)
    if (gymRes.data) setGymSchedules(gymRes.data)
    setHealthLoading(false)
  }, [getAuthUser, setWorkoutSessions, setWeightLog, setGymSchedules, setHealthLoading])

  // ── Load sleep & water logs ──
  const loadSleepWater = useCallback(async () => {
    const user = await getAuthUser()
    if (!user) return
    const [sleepRes, waterRes] = await Promise.all([
      supabase
        .from('sleep_log')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(30),
      supabase
        .from('water_log')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(30),
    ])
    if (sleepRes.data) setSleepLog(sleepRes.data)
    if (waterRes.data) setWaterLog(waterRes.data)
  }, [getAuthUser, setSleepLog, setWaterLog])

  // ── Load notes ──
  const loadNotes = useCallback(async () => {
    const user = await getAuthUser()
    if (!user) return
    setNoteLoading(true)
    const { data } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', user.id)
      .order('is_pinned', { ascending: false })
      .order('updated_at', { ascending: false })
    if (data) setNotes(data)
    setNoteLoading(false)
  }, [getAuthUser, setNotes, setNoteLoading])

  // ── Load savings ──
  const loadSavings = useCallback(async () => {
    const user = await getAuthUser()
    if (!user) return
    setSavLoading(true)
    const [plansRes, movsRes] = await Promise.all([
      supabase
        .from('saving_plans')
        .select('*')
        .eq('user_id', user.id)
        .order('priority', { ascending: false }),
      supabase
        .from('saving_movements')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(200),
    ])
    if (plansRes.data) setPlans(plansRes.data)
    if (movsRes.data) setMovements(movsRes.data)
    setSavLoading(false)
  }, [getAuthUser, setPlans, setMovements, setSavLoading])

  // ── Initial load ──
  useEffect(() => {
    loadUserConfig()
    loadNotes()
    loadSavings()
    loadHealth()
    loadSleepWater()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Reload month-dependent data when month changes ──
  useEffect(() => {
    loadCalendar()
    loadFinance()
    loadFirme()
  }, [selectedMonth]) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    reload: {
      userConfig: loadUserConfig,
      calendar: loadCalendar,
      finance: loadFinance,
      firme: loadFirme,
      health: loadHealth,
      sleepWater: loadSleepWater,
      notes: loadNotes,
      savings: loadSavings,
      all: () => {
        loadUserConfig()
        loadCalendar()
        loadFinance()
        loadFirme()
        loadHealth()
        loadSleepWater()
        loadNotes()
        loadSavings()
      },
    },
  }
}
