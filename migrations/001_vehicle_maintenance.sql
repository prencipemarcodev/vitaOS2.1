-- Migration: Vehicle Maintenance Tracking Fields
-- Adds maintenance data columns to vehicles table and ensures vehicle_logs has required fields

-- ── vehicles table: maintenance parameters ────────────────────────
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS tank_capacity_l       INTEGER DEFAULT 50;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS oil_interval_km       INTEGER DEFAULT 15000;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS tire_interval_km      INTEGER DEFAULT 40000;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS wiper_interval_months INTEGER DEFAULT 18;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS last_oil_change_km    INTEGER;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS last_oil_change_date  DATE;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS last_tire_change_km   INTEGER;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS last_tire_change_date DATE;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS last_wiper_change_date DATE;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS current_odometer      INTEGER;

-- ── vehicle_logs table: ensure fuel-specific columns exist ────────
ALTER TABLE vehicle_logs ADD COLUMN IF NOT EXISTS liters           NUMERIC(6,2);
ALTER TABLE vehicle_logs ADD COLUMN IF NOT EXISTS price_per_liter  NUMERIC(5,3);
