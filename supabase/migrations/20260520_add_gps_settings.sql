-- Migrazione per aggiungere colonne GPS alla tabella user_config
-- VitaOS 2.1

ALTER TABLE user_config
  ADD COLUMN IF NOT EXISTS gps_preset TEXT DEFAULT 'balanced',
  ADD COLUMN IF NOT EXISTS gps_jitter_meters INTEGER DEFAULT 6,
  ADD COLUMN IF NOT EXISTS gps_keepalive BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS gps_keepalive_interval_ms INTEGER DEFAULT 2000;

-- Commenti per documentazione schema
COMMENT ON COLUMN user_config.gps_preset IS 'Preset di precisione GPS preferito (balanced, high, max)';
COMMENT ON COLUMN user_config.gps_jitter_meters IS 'Filtro di tolleranza jitter in metri per GPS';
COMMENT ON COLUMN user_config.gps_keepalive IS 'Se abilitare keep-alive GPS in background (iOS)';
COMMENT ON COLUMN user_config.gps_keepalive_interval_ms IS 'Intervallo in millisecondi per segnale di keep-alive';
