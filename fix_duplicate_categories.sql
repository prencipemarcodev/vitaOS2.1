-- =============================================================
-- VitaOS 2.1 — Rimuovi Categorie Duplicate & Indici Univoci
-- Esegui questo script nel SQL Editor di Supabase Dashboard
-- per risolvere alla radice il problema dei duplicati.
-- =============================================================

-- 1. Rimuovi i duplicati delle categorie di default (user_id IS NULL), mantenendo solo quella con l'id più basso
DELETE FROM public.finance_categories a USING (
  SELECT MIN(id::text)::uuid as id, name, type
  FROM public.finance_categories
  WHERE user_id IS NULL
  GROUP BY name, type
  HAVING COUNT(*) > 1
) b
WHERE a.name = b.name 
  AND a.type = b.type 
  AND a.user_id IS NULL 
  AND a.id > b.id;

-- 2. Rimuovi i duplicati delle categorie personalizzate (user_id IS NOT NULL), mantenendo solo quella con l'id più basso per ogni utente
DELETE FROM public.finance_categories a USING (
  SELECT MIN(id::text)::uuid as id, name, type, user_id
  FROM public.finance_categories
  WHERE user_id IS NOT NULL
  GROUP BY name, type, user_id
  HAVING COUNT(*) > 1
) b
WHERE a.name = b.name 
  AND a.type = b.type 
  AND a.user_id = b.user_id 
  AND a.id > b.id;

-- 3. Rimuovi eventuali vincoli di unicità precedenti su (name, type) che impediscono a utenti diversi di inserire categorie con lo stesso nome
ALTER TABLE public.finance_categories DROP CONSTRAINT IF EXISTS finance_categories_name_type_key;

-- 4. Crea indici univoci parziali per garantire l'integrità dei dati:
--    A. Impedisce duplicati nelle categorie di default (dove user_id è null)
CREATE UNIQUE INDEX IF NOT EXISTS finance_categories_default_uniq 
  ON public.finance_categories (name, type) 
  WHERE user_id IS NULL;

--    B. Impedisce duplicati nelle categorie personalizzate per singolo utente (dove user_id NON è null)
CREATE UNIQUE INDEX IF NOT EXISTS finance_categories_user_uniq 
  ON public.finance_categories (name, type, user_id) 
  WHERE user_id IS NOT NULL;
