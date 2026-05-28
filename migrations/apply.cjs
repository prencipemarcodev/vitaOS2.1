// Run via: node migrations/apply.cjs
const https = require('https')

const SUPABASE_URL = 'https://vqyneoyhusbjetodsbzu.supabase.co'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxeW5lb3lodXNiamV0b2RzYnp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1OTE2NTQsImV4cCI6MjA5NDE2NzY1NH0.sKzdLi4eHI4xJi6IyFSCe4l1EHGmCOubWJZJfd-ezQY'

// The migration statements to run one by one via PATCH/upsert
// Since we can't run DDL directly via REST, we'll use the vehicles table API
// to verify which columns exist, then print the SQL to run in Supabase Studio

const statements = [
  "ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS tank_capacity_l INTEGER DEFAULT 50",
  "ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS oil_interval_km INTEGER DEFAULT 15000",
  "ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS tire_interval_km INTEGER DEFAULT 40000",
  "ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS wiper_interval_months INTEGER DEFAULT 18",
  "ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS last_oil_change_km INTEGER",
  "ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS last_oil_change_date DATE",
  "ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS last_tire_change_km INTEGER",
  "ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS last_tire_change_date DATE",
  "ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS last_wiper_change_date DATE",
  "ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS current_odometer INTEGER",
  "ALTER TABLE vehicle_logs ADD COLUMN IF NOT EXISTS liters NUMERIC(6,2)",
  "ALTER TABLE vehicle_logs ADD COLUMN IF NOT EXISTS price_per_liter NUMERIC(5,3)",
]

console.log('\n=== Migration SQL to run in Supabase Studio ===')
console.log('Go to: https://supabase.com/dashboard/project/vqyneoyhusbjetodsbzu/sql/new\n')
console.log(statements.join(';\n') + ';')
console.log('\n=== End of migration ===')
