-- =====================================================
-- VITAOS 2.1 — MIGRAZIONE CONTI PERSONALIZZABILI
-- Aggiunge la colonna custom_accounts alla tabella user_config
-- =====================================================

ALTER TABLE user_config ADD COLUMN IF NOT EXISTS custom_accounts JSONB DEFAULT NULL;

COMMENT ON COLUMN user_config.custom_accounts IS 'Lista dei conti e carte personalizzabili dell''utente';
