-- =====================================================
-- VITAOS 2.1 — SCHEMA INIZIALE COMPLETO
-- Supabase / PostgreSQL
-- =====================================================

-- ─── 1. Configurazione utente (riga singola) ───

CREATE TABLE IF NOT EXISTS user_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),

  -- Aspetto
  theme TEXT DEFAULT 'light',

  -- Orari lavorativi per giorno (JSONB)
  -- { "1": { "enabled": true, "from": "08:30", "to": "17:30" }, ... }
  work_schedule JSONB DEFAULT '{
    "1": {"enabled": true,  "from": "08:30", "to": "17:30"},
    "2": {"enabled": true,  "from": "08:30", "to": "17:30"},
    "3": {"enabled": true,  "from": "08:30", "to": "17:30"},
    "4": {"enabled": true,  "from": "08:30", "to": "17:30"},
    "5": {"enabled": true,  "from": "08:30", "to": "17:30"},
    "6": {"enabled": false},
    "0": {"enabled": false}
  }',
  daily_hours NUMERIC(4,2) DEFAULT 8.0,

  -- Orari studio
  study_schedule JSONB DEFAULT '{}',

  -- Orari palestra
  gym_schedule JSONB DEFAULT '{}',

  -- Ferie e malattie
  annual_leave_days INTEGER DEFAULT 26,
  sick_days_used NUMERIC(5,2) DEFAULT 0,
  leave_days_used NUMERIC(5,2) DEFAULT 0,

  -- Reddito
  monthly_net_income NUMERIC(10,2) DEFAULT 0,
  has_thirteenth BOOLEAN DEFAULT true,
  has_fourteenth BOOLEAN DEFAULT false,
  thirteenth_month INTEGER DEFAULT 12,
  fourteenth_month INTEGER DEFAULT 6,

  -- Risparmio
  savings_target_pct NUMERIC(5,2) DEFAULT 20,

  -- Calendario
  patron_saint_date DATE,

  -- Salute
  weight_kg NUMERIC(5,2),
  weight_updated_at DATE,
  run_monthly_goal_km NUMERIC(6,2) DEFAULT 50,
  workout_weekly_goal INTEGER DEFAULT 4,
  total_run_km_ever NUMERIC(10,3) DEFAULT 0,

  -- Misc
  currency TEXT DEFAULT 'EUR',
  locale TEXT DEFAULT 'it-IT',
  timezone TEXT DEFAULT 'Europe/Rome',
  onboarding_completed BOOLEAN DEFAULT false,

  -- Saldi iniziali (inseriti durante onboarding)
  initial_bank_balance NUMERIC(10,2) DEFAULT 0,
  initial_cash_balance NUMERIC(10,2) DEFAULT 0
);


-- ─── 2. Notifiche lette ───

CREATE TABLE IF NOT EXISTS notifications_read (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_key TEXT NOT NULL UNIQUE,
  read_at TIMESTAMPTZ DEFAULT now()
);


-- ─── 3. Ricorrenze annuali ───

CREATE TABLE IF NOT EXISTS recurring_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  title TEXT NOT NULL,
  description TEXT,
  month INTEGER NOT NULL,
  day INTEGER NOT NULL,
  category TEXT DEFAULT 'personale',
  icon TEXT,
  notify_days_before INTEGER DEFAULT 3
);


-- ─── 4. Calendario — eventi ───

CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  end_date DATE,
  start_time TIME,
  end_time TIME,
  all_day BOOLEAN DEFAULT false,
  category TEXT NOT NULL DEFAULT 'personale',
  is_recurring BOOLEAN DEFAULT false,
  recurring_type TEXT,
  recurring_end_date DATE
);


-- ─── 5. Assenze ───

CREATE TABLE IF NOT EXISTS absences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  type TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days_count NUMERIC(5,2) NOT NULL,
  notes TEXT
);


-- ─── 6. Firme — sessioni di lavoro ───

CREATE TABLE IF NOT EXISTS work_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  date DATE NOT NULL,
  check_in TIME NOT NULL,
  check_out TIME,
  duration_minutes INTEGER,
  notes TEXT,
  is_manual BOOLEAN DEFAULT false,
  inserted_at TIMESTAMPTZ DEFAULT now()
);


-- ─── 7. Finanze — transazioni ───

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  date DATE NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  type TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  payment_method TEXT DEFAULT 'bank',
  is_planned BOOLEAN DEFAULT false,
  planned_date DATE,
  is_recurring BOOLEAN DEFAULT false,
  recurring_period TEXT,
  recurring_day INTEGER,
  parent_transaction_id UUID
);


-- ─── 8. Finanze — categorie ───

CREATE TABLE IF NOT EXISTS finance_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  is_default BOOLEAN DEFAULT false,
  is_periodic BOOLEAN DEFAULT false,
  periodic_amount NUMERIC(10,2),
  periodic_day INTEGER,
  periodic_period TEXT DEFAULT 'monthly'
);


-- ─── 9. Risparmi — piani ───

CREATE TABLE IF NOT EXISTS saving_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  name TEXT NOT NULL,
  description TEXT,
  target_amount NUMERIC(10,2) NOT NULL,
  current_amount NUMERIC(10,2) DEFAULT 0,
  target_date DATE,
  type TEXT DEFAULT 'goal',
  icon TEXT,
  color TEXT,
  priority INTEGER DEFAULT 0,
  monthly_contribution NUMERIC(10,2),
  is_active BOOLEAN DEFAULT true
);


-- ─── 10. Risparmi — movimenti ───

CREATE TABLE IF NOT EXISTS saving_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  plan_id UUID REFERENCES saving_plans(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  type TEXT NOT NULL,
  date DATE NOT NULL,
  notes TEXT
);


-- ─── 11. Salute — sessioni allenamento ───

CREATE TABLE IF NOT EXISTS workout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  date DATE NOT NULL,
  type TEXT NOT NULL,
  duration_minutes INTEGER,
  notes TEXT,
  scheda_id UUID,
  run_distance_km NUMERIC(6,3),
  run_avg_pace TEXT,
  run_calories INTEGER,
  run_route TEXT
);


-- ─── 12. Salute — storico peso ───

CREATE TABLE IF NOT EXISTS weight_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  date DATE NOT NULL,
  weight_kg NUMERIC(5,2) NOT NULL,
  notes TEXT
);


-- ─── 13. Salute — schede palestra ───

CREATE TABLE IF NOT EXISTS gym_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  name TEXT NOT NULL,
  description TEXT,
  days INTEGER[],
  is_active BOOLEAN DEFAULT true,
  exercises JSONB
);


-- ─── 14. Note ───

CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  title TEXT,
  content TEXT NOT NULL,
  color TEXT DEFAULT '#FFFFFF',
  is_pinned BOOLEAN DEFAULT false,
  tags TEXT[]
);


-- =====================================================
-- INDICI
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_work_sessions_date ON work_sessions(date DESC);
CREATE INDEX IF NOT EXISTS idx_calendar_events_date ON calendar_events(date);
CREATE INDEX IF NOT EXISTS idx_absences_dates ON absences(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_date ON workout_sessions(date DESC);
CREATE INDEX IF NOT EXISTS idx_saving_movements_plan ON saving_movements(plan_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_weight_log_date ON weight_log(date DESC);
CREATE INDEX IF NOT EXISTS idx_recurring_events_month_day ON recurring_events(month, day);


-- =====================================================
-- RLS (Row Level Security) — singolo utente, accesso aperto
-- =====================================================

ALTER TABLE user_config         ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications_read  ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_events    ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events     ENABLE ROW LEVEL SECURITY;
ALTER TABLE absences            ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_sessions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_categories  ENABLE ROW LEVEL SECURITY;
ALTER TABLE saving_plans        ENABLE ROW LEVEL SECURITY;
ALTER TABLE saving_movements    ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sessions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_log          ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_schedules       ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes               ENABLE ROW LEVEL SECURITY;

-- Policy: accesso completo per singolo utente (anon key)
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'user_config', 'notifications_read', 'recurring_events',
    'calendar_events', 'absences', 'work_sessions',
    'transactions', 'finance_categories',
    'saving_plans', 'saving_movements',
    'workout_sessions', 'weight_log', 'gym_schedules', 'notes'
  ]) LOOP
    EXECUTE format('CREATE POLICY "allow_all_select_%s" ON %I FOR SELECT USING (true)', t, t);
    EXECUTE format('CREATE POLICY "allow_all_insert_%s" ON %I FOR INSERT WITH CHECK (true)', t, t);
    EXECUTE format('CREATE POLICY "allow_all_update_%s" ON %I FOR UPDATE USING (true) WITH CHECK (true)', t, t);
    EXECUTE format('CREATE POLICY "allow_all_delete_%s" ON %I FOR DELETE USING (true)', t, t);
  END LOOP;
END $$;


-- =====================================================
-- SEED — Categorie finanze default
-- =====================================================

-- Entrate
INSERT INTO finance_categories (name, type, icon, color, is_default) VALUES
  ('Stipendio',       'income',  'Banknote', '#3d9970', true),
  ('Freelance',       'income',  'Laptop', '#4a90d9', true),
  ('Regalo',          'income',  'Gift', '#9b59b6', true),
  ('Rimborso',        'income',  'RefreshCcw', '#d4a017', true),
  ('13ª Mensilità',   'income',  'TreePine', '#3d9970', true),
  ('14ª Mensilità',   'income',  'Sun', '#3d9970', true),
  ('Altro',           'income',  'Clipboard', '#95a5a6', true);

-- Uscite
INSERT INTO finance_categories (name, type, icon, color, is_default) VALUES
  ('Casa/Affitto',    'expense', 'Home', '#e05252', true),
  ('Cibo',            'expense', 'Utensils', '#d4a017', true),
  ('Trasporti',       'expense', 'Car', '#4a90d9', true),
  ('Salute',          'expense', 'Heart', '#e05252', true),
  ('Sport',           'expense', 'Dumbbell', '#3d9970', true),
  ('Abbigliamento',   'expense', 'Shirt', '#9b59b6', true),
  ('Intrattenimento', 'expense', 'Film', '#d4a017', true),
  ('Utility',         'expense', 'Zap', '#7f8c8d', true),
  ('Abbonamenti',     'expense', 'Tv', '#4a90d9', true),
  ('Risparmio',       'expense', 'PiggyBank', '#3d9970', true),
  ('Altro',           'expense', 'Clipboard', '#95a5a6', true);


-- =====================================================
-- SEED — Riga user_config iniziale
-- =====================================================

INSERT INTO user_config (id) VALUES (gen_random_uuid());
