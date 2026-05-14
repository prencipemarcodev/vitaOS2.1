-- Migrazione per Modulo GPS Run Tracker
-- VitaOS 2.1

-- Aggiornamento tabella sessioni di allenamento
ALTER TABLE workout_sessions 
  ADD COLUMN IF NOT EXISTS run_distance_km NUMERIC(10,3) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS run_avg_pace TEXT DEFAULT '--:--',
  ADD COLUMN IF NOT EXISTS run_calories INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS run_max_speed NUMERIC(6,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS run_elevation_gain NUMERIC(8,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS run_polyline JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS run_splits JSONB DEFAULT '[]';

-- Aggiornamento configurazione utente per statistiche cumulative
ALTER TABLE user_config
  ADD COLUMN IF NOT EXISTS total_run_km_ever NUMERIC(15,3) DEFAULT 0;

-- Commenti per documentazione schema
COMMENT ON COLUMN workout_sessions.run_polyline IS 'Array di coordinate GPS: [{lat, lng, alt, ts}]';
COMMENT ON COLUMN workout_sessions.run_splits IS 'Dettaglio km per km: [{km, pace_sec, elapsed_sec}]';
