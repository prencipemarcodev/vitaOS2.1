-- =============================================================
-- VitaOS 2.1 — Tabella Gestione Buste Paga
-- Esegui questo script nel SQL Editor di Supabase Dashboard
-- per creare la tabella necessaria per il modulo Buste Paga.
-- =============================================================

CREATE TABLE IF NOT EXISTS public.payslips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    month_name TEXT NOT NULL,
    net_amount NUMERIC(10,2) NOT NULL,
    gross_amount NUMERIC(10,2),
    taxes NUMERIC(10,2),
    contributions NUMERIC(10,2),
    worked_hours NUMERIC(10,2),
    accrued_vacation NUMERIC(10,2),
    tfr_amount NUMERIC(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Abilita Row Level Security
ALTER TABLE public.payslips ENABLE ROW LEVEL SECURITY;

-- Policy di Sicurezza (RLS)
CREATE POLICY "Payslips: l'utente vede solo i propri dati"
    ON public.payslips FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Payslips: l'utente crea i propri dati"
    ON public.payslips FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Payslips: l'utente aggiorna i propri dati"
    ON public.payslips FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Payslips: l'utente elimina i propri dati"
    ON public.payslips FOR DELETE
    USING (auth.uid() = user_id);
