-- =============================================================
-- VitaOS 2.1 — Nuove Tabelle & Funzionalità
-- Esegui questo script nel SQL Editor di Supabase Dashboard
-- per creare le tabelle necessarie per le nuove features.
-- =============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. TABELLA TASKS (Attività/Todo del Calendario)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    title TEXT NOT NULL,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tasks: l'utente vede solo i propri task"
    ON public.tasks FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Tasks: l'utente crea i propri task"
    ON public.tasks FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Tasks: l'utente aggiorna i propri task"
    ON public.tasks FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Tasks: l'utente elimina i propri task"
    ON public.tasks FOR DELETE
    USING (auth.uid() = user_id);


-- ─────────────────────────────────────────────────────────────
-- 2. TABELLA VEHICLE_LOGS (Gestione Auto e Carburante)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.vehicle_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('fuel', 'maintenance', 'insurance', 'tax', 'other')),
    amount NUMERIC(10,2) NOT NULL,
    odometer INTEGER,
    liters NUMERIC(10,2),
    price_per_liter NUMERIC(10,3),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS
ALTER TABLE public.vehicle_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vehicle Logs: l'utente vede solo i propri log"
    ON public.vehicle_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Vehicle Logs: l'utente crea i propri log"
    ON public.vehicle_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Vehicle Logs: l'utente aggiorna i propri log"
    ON public.vehicle_logs FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Vehicle Logs: l'utente elimina i propri log"
    ON public.vehicle_logs FOR DELETE
    USING (auth.uid() = user_id);


-- ─────────────────────────────────────────────────────────────
-- 3. TABELLA MOOD_LOGS (Wellness & Salute Tracciamento Mood)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.mood_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    mood_score INTEGER NOT NULL CHECK (mood_score BETWEEN 1 AND 5), -- 1: Pessimo, 5: Fantastico
    energy_score INTEGER CHECK (energy_score BETWEEN 1 AND 5),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Assicura che un utente inserisca un solo mood al giorno
CREATE UNIQUE INDEX IF NOT EXISTS mood_logs_user_date_idx ON public.mood_logs (user_id, date);

-- RLS
ALTER TABLE public.mood_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Mood Logs: l'utente vede solo i propri log"
    ON public.mood_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Mood Logs: l'utente crea i propri log"
    ON public.mood_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Mood Logs: l'utente aggiorna i propri log"
    ON public.mood_logs FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Mood Logs: l'utente elimina i propri log"
    ON public.mood_logs FOR DELETE
    USING (auth.uid() = user_id);


-- ─────────────────────────────────────────────────────────────
-- 4. TABELLA SUBSCRIPTIONS (Gestore Abbonamenti Dedicato)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    billing_period TEXT DEFAULT 'monthly' CHECK (billing_period IN ('monthly', 'yearly')),
    next_renewal_date DATE NOT NULL,
    payment_method TEXT DEFAULT 'card' CHECK (payment_method IN ('bank', 'card', 'cash', 'other')),
    category_id UUID REFERENCES public.finance_categories(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    notify_before_days INTEGER DEFAULT 3,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Subscriptions: l'utente vede solo i propri abbonamenti"
    ON public.subscriptions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Subscriptions: l'utente crea i propri abbonamenti"
    ON public.subscriptions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Subscriptions: l'utente aggiorna i propri abbonamenti"
    ON public.subscriptions FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Subscriptions: l'utente elimina i propri abbonamenti"
    ON public.subscriptions FOR DELETE
    USING (auth.uid() = user_id);
