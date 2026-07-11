-- =====================================================
-- VITAOS 2.1 — MIGRAZIONE SOGLIA SICUREZZA LIQUIDITÀ
-- Aggiunge la colonna liquidity_safety_threshold alla tabella user_config
-- =====================================================

ALTER TABLE user_config ADD COLUMN IF NOT EXISTS liquidity_safety_threshold NUMERIC(10,2) DEFAULT 200.00;

COMMENT ON COLUMN user_config.liquidity_safety_threshold IS 'Soglia di sicurezza sotto la quale il sistema non consiglia di risparmiare';
