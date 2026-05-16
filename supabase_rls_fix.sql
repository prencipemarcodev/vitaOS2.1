-- =============================================================
-- VitaOS — Row Level Security (RLS) Fix
-- Esegui questo script nel SQL Editor di Supabase Dashboard
-- per proteggere definitivamente i dati di ogni utente.
-- =============================================================

-- ── 1. Abilita RLS su tutte le tabelle ──
ALTER TABLE public.user_config        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.absences           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_events   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_sessions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sessions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weight_log         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gym_schedules      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sleep_log          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.water_log          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saving_plans       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saving_movements   ENABLE ROW LEVEL SECURITY;

-- ── 2. Rimuovi policy vecchie (se esistono) ──
DO $$ 
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'user_config','calendar_events','absences','recurring_events',
    'transactions','finance_categories','work_sessions','workout_sessions',
    'weight_log','gym_schedules','sleep_log','water_log',
    'notes','saving_plans','saving_movements'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Users can manage their own data" ON public.%I', t);
    EXECUTE format('DROP POLICY IF EXISTS "user_isolation" ON public.%I', t);
  END LOOP;
END $$;

-- ── 3. Crea policy di isolamento per ogni tabella ──
-- Ogni utente può fare SELECT/INSERT/UPDATE/DELETE solo sui propri record.

CREATE POLICY "user_isolation" ON public.user_config
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_isolation" ON public.calendar_events
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_isolation" ON public.absences
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_isolation" ON public.recurring_events
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_isolation" ON public.transactions
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_isolation" ON public.finance_categories
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_isolation" ON public.work_sessions
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_isolation" ON public.workout_sessions
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_isolation" ON public.weight_log
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_isolation" ON public.gym_schedules
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_isolation" ON public.sleep_log
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_isolation" ON public.water_log
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_isolation" ON public.notes
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_isolation" ON public.saving_plans
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_isolation" ON public.saving_movements
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ── 4. Verifica ──
-- Esegui questa query per confermare che RLS è attivo su tutte le tabelle:
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN (
    'user_config','calendar_events','absences','recurring_events',
    'transactions','finance_categories','work_sessions','workout_sessions',
    'weight_log','gym_schedules','sleep_log','water_log',
    'notes','saving_plans','saving_movements'
  )
ORDER BY tablename;
