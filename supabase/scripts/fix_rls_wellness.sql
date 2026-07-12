-- 1. Assicurati che le tabelle esistano e abbiano la colonna user_id
-- (Esegui questo se non le hai ancora create o se manca la colonna)

CREATE TABLE IF NOT EXISTS public.water_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL DEFAULT auth.uid(),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    amount_ml INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sleep_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL DEFAULT auth.uid(),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    bedtime TIME NOT NULL,
    wakeup TIME NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Abilita il Row Level Security (RLS)
ALTER TABLE public.water_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sleep_log ENABLE ROW LEVEL SECURITY;

-- 3. Crea le policy per water_log (Permessi limitati al proprio user_id)
DROP POLICY IF EXISTS "Users can view their own water logs" ON public.water_log;
CREATE POLICY "Users can view their own water logs" ON public.water_log
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own water logs" ON public.water_log;
CREATE POLICY "Users can insert their own water logs" ON public.water_log
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own water logs" ON public.water_log;
CREATE POLICY "Users can update their own water logs" ON public.water_log
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own water logs" ON public.water_log;
CREATE POLICY "Users can delete their own water logs" ON public.water_log
    FOR DELETE USING (auth.uid() = user_id);

-- 4. Crea le policy per sleep_log (Permessi limitati al proprio user_id)
DROP POLICY IF EXISTS "Users can view their own sleep logs" ON public.sleep_log;
CREATE POLICY "Users can view their own sleep logs" ON public.sleep_log
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own sleep logs" ON public.sleep_log;
CREATE POLICY "Users can insert their own sleep logs" ON public.sleep_log
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own sleep logs" ON public.sleep_log;
CREATE POLICY "Users can update their own sleep logs" ON public.sleep_log
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own sleep logs" ON public.sleep_log;
CREATE POLICY "Users can delete their own sleep logs" ON public.sleep_log
    FOR DELETE USING (auth.uid() = user_id);
