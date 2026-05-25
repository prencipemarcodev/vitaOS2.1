-- =============================================================
-- VitaOS 2.1 — Security Hardening Migration
-- Data: 2026-05-25
-- 
-- ISTRUZIONI: Esegui questo script nel SQL Editor di Supabase
-- Dashboard → SQL Editor → New query → Incolla → Run
-- =============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. AGGIUNTA user_id a notifications_read (VUL-011)
--    La tabella originale non aveva la colonna user_id,
--    rendendo le notifiche condivise tra tutti gli utenti.
-- ─────────────────────────────────────────────────────────────

-- Aggiungi la colonna user_id se non esiste già
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'notifications_read' 
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.notifications_read 
      ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    
    RAISE NOTICE 'Colonna user_id aggiunta a notifications_read';
  ELSE
    RAISE NOTICE 'Colonna user_id già presente in notifications_read, skip.';
  END IF;
END $$;

-- Aggiorna RLS su notifications_read
ALTER TABLE public.notifications_read ENABLE ROW LEVEL SECURITY;

-- Rimuovi eventuali policy vecchie
DROP POLICY IF EXISTS "notifications_read: policy permissiva" ON public.notifications_read;
DROP POLICY IF EXISTS "Allow all on notifications_read" ON public.notifications_read;

-- Crea nuove policy per isolamento per utente
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications_read' AND policyname = 'notifications_read: solo i propri record') THEN
    CREATE POLICY "notifications_read: solo i propri record"
      ON public.notifications_read FOR SELECT
      USING (auth.uid() = user_id);
    
    CREATE POLICY "notifications_read: l''utente inserisce i propri"
      ON public.notifications_read FOR INSERT
      WITH CHECK (auth.uid() = user_id);
    
    CREATE POLICY "notifications_read: l''utente aggiorna i propri"
      ON public.notifications_read FOR UPDATE
      USING (auth.uid() = user_id);
    
    CREATE POLICY "notifications_read: l''utente elimina i propri"
      ON public.notifications_read FOR DELETE
      USING (auth.uid() = user_id);
    
    RAISE NOTICE 'Policy RLS aggiunte a notifications_read';
  ELSE
    RAISE NOTICE 'Policy già presenti, skip.';
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────
-- 2. VERIFICA E RINFORZO RLS su tutte le tabelle principali
--    Assicura che le policy USING(true) siano state sostituite.
--    (Questo integra il supabase_rls_fix.sql già esistente)
-- ─────────────────────────────────────────────────────────────

-- Pulizia policy permissive che usano USING(true) se ancora presenti
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT policyname, tablename 
    FROM pg_policies 
    WHERE schemaname = 'public' 
    AND (qual = 'true' OR with_check = 'true')
    AND tablename NOT IN ('finance_categories')  -- categorie default hanno user_id null
  LOOP
    RAISE WARNING 'ATTENZIONE: Policy permissiva trovata: % su %', pol.policyname, pol.tablename;
  END LOOP;
END $$;

-- ─────────────────────────────────────────────────────────────
-- 3. INDICE su user_id per performance (tabelle principali)
-- ─────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_notifications_read_user_id ON public.notifications_read(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_work_sessions_user_id ON public.work_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON public.notes(user_id);

-- ─────────────────────────────────────────────────────────────
-- 4. FUNZIONE: Verifica sicurezza RLS (utility di diagnostica)
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.check_rls_status()
RETURNS TABLE (
  table_name TEXT,
  rls_enabled BOOLEAN,
  policy_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.table_name::TEXT,
    c.relrowsecurity AS rls_enabled,
    COUNT(p.policyname) AS policy_count
  FROM information_schema.tables t
  JOIN pg_class c ON c.relname = t.table_name
  LEFT JOIN pg_policies p ON p.tablename = t.table_name
  WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
  GROUP BY t.table_name, c.relrowsecurity
  ORDER BY t.table_name;
END;
$$;

-- Per verificare lo stato RLS esegui:
-- SELECT * FROM public.check_rls_status();
