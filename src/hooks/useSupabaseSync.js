import { useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAppStore } from '@/store/useAppStore'
import { useCalendarStore } from '@/store/useCalendarStore'
import { useFinanceStore } from '@/store/useFinanceStore'
import { useFirmeStore } from '@/store/useFirmeStore'
import { useHealthStore } from '@/store/useHealthStore'
import { useNoteStore } from '@/store/useNoteStore'
import { useSavingsStore } from '@/store/useSavingsStore'
import { startOfMonth, endOfMonth, format } from 'date-fns'

/**
 * useSupabaseSync — carica i dati iniziali da Supabase e li sincronizza negli store.
 * Viene montato una volta in App.jsx.
 */
export function useSupabaseSync() {
  const { selectedMonth, setUserConfig, setOnboardingCompleted } = useAppStore()
  const { setEvents, setAbsences, setRecurringEvents, setLoading: setCalLoading } = useCalendarStore()
  const { setTransactions, setCategories, setLoading: setFinLoading } = useFinanceStore()
  const { setSessions, setLoading: setFirmeLoading } = useFirmeStore()
  const { setWorkoutSessions, setWeightLog, setGymSchedules, setLoading: setHealthLoading } = useHealthStore()
  const { setNotes, setLoading: setNoteLoading } = useNoteStore()
  const { setPlans, setMovements, setLoading: setSavLoading } = useSavingsStore()

  const monthDate = new Date(selectedMonth)
  const monthStart = format(startOfMonth(monthDate), 'yyyy-MM-dd')
  const monthEnd = format(endOfMonth(monthDate), 'yyyy-MM-dd')

  // ── Load user config ──
  const loadUserConfig = useCallback(async () => {
    const { data } = await supabase
      .from('user_config')
      .select('*')
      .limit(1)
      .single()
    if (data) {
      setUserConfig(data)
      setOnboardingCompleted(data.onboarding_completed || false)
    }
  }, [setUserConfig, setOnboardingCompleted])

  // ── Load calendar events for the month ──
  const loadCalendar = useCallback(async () => {
    setCalLoading(true)
    const [eventsRes, absencesRes, recurringRes] = await Promise.all([
      supabase
        .from('calendar_events')
        .select('*')
        .gte('date', monthStart)
        .lte('date', monthEnd)
        .order('date'),
      supabase
        .from('absences')
        .select('*')
        .or(`start_date.lte.${monthEnd},end_date.gte.${monthStart}`)
        .order('start_date'),
      supabase
        .from('recurring_events')
        .select('*')
        .order('month,day'),
    ])
    if (eventsRes.data) setEvents(eventsRes.data)
    if (absencesRes.data) setAbsences(absencesRes.data)
    if (recurringRes.data) setRecurringEvents(recurringRes.data)
    setCalLoading(false)
  }, [monthStart, monthEnd, setEvents, setAbsences, setRecurringEvents, setCalLoading])

  // ── Load finance data for the month ──
  const loadFinance = useCallback(async () => {
    setFinLoading(true)
    const [txRes, catRes] = await Promise.all([
      supabase
        .from('transactions')
        .select('*')
        .gte('date', monthStart)
        .lte('date', monthEnd)
        .order('date', { ascending: false }),
      supabase
        .from('finance_categories')
        .select('*')
        .order('is_default', { ascending: false }),
    ])
    if (txRes.data) setTransactions(txRes.data)
    if (catRes.data) setCategories(catRes.data)
    setFinLoading(false)
  }, [monthStart, monthEnd, setTransactions, setCategories, setFinLoading])

  // ── Load work sessions for the month ──
  const loadFirme = useCallback(async () => {
    setFirmeLoading(true)
    const { data } = await supabase
      .from('work_sessions')
      .select('*')
      .gte('date', monthStart)
      .lte('date', monthEnd)
      .order('date', { ascending: false })
    if (data) setSessions(data)
    setFirmeLoading(false)
  }, [monthStart, monthEnd, setSessions, setFirmeLoading])

  // ── Load health data ──
  const loadHealth = useCallback(async () => {
    setHealthLoading(true)
    const [workoutsRes, weightRes, gymRes] = await Promise.all([
      supabase
        .from('workout_sessions')
        .select('*')
        .order('date', { ascending: false })
        .limit(100),
      supabase
        .from('weight_log')
        .select('*')
        .order('date', { ascending: false })
        .limit(90),
      supabase
        .from('gym_schedules')
        .select('*')
        .order('created_at'),
    ])
    if (workoutsRes.data) setWorkoutSessions(workoutsRes.data)
    if (weightRes.data) setWeightLog(weightRes.data)
    if (gymRes.data) setGymSchedules(gymRes.data)
    setHealthLoading(false)
  }, [setWorkoutSessions, setWeightLog, setGymSchedules, setHealthLoading])

  // ── Load notes ──
  const loadNotes = useCallback(async () => {
    setNoteLoading(true)
    const { data } = await supabase
      .from('notes')
      .select('*')
      .order('is_pinned', { ascending: false })
      .order('updated_at', { ascending: false })
    if (data) setNotes(data)
    setNoteLoading(false)
  }, [setNotes, setNoteLoading])

  // ── Load savings ──
  const loadSavings = useCallback(async () => {
    setSavLoading(true)
    const [plansRes, movsRes] = await Promise.all([
      supabase
        .from('saving_plans')
        .select('*')
        .order('priority', { ascending: false }),
      supabase
        .from('saving_movements')
        .select('*')
        .order('date', { ascending: false })
        .limit(200),
    ])
    if (plansRes.data) setPlans(plansRes.data)
    if (movsRes.data) setMovements(movsRes.data)
    setSavLoading(false)
  }, [setPlans, setMovements, setSavLoading])

  // ── Initial load ──
  useEffect(() => {
    loadUserConfig()
    loadNotes()
    loadSavings()
    loadHealth()
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
      notes: loadNotes,
      savings: loadSavings,
      all: () => {
        loadUserConfig()
        loadCalendar()
        loadFinance()
        loadFirme()
        loadHealth()
        loadNotes()
        loadSavings()
      },
    },
  }
}
