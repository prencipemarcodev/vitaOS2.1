/**
 * Script per creare le tabelle su Supabase usando le API REST.
 * Esegue le operazioni una per una verificando i risultati.
 * 
 * Usage: node supabase/setup.mjs
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || readEnvFile('VITE_SUPABASE_URL')
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || readEnvFile('VITE_SUPABASE_ANON_KEY')

function readEnvFile(key) {
  try {
    const content = readFileSync('.env.local', 'utf-8')
    const match = content.match(new RegExp(`^${key}=(.+)$`, 'm'))
    return match ? match[1].trim() : ''
  } catch { return '' }
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// ─── Verifica connessione ───
async function testConnection() {
  console.log('🔌 Testing Supabase connection...')
  console.log(`   URL: ${SUPABASE_URL}`)
  
  // Try a simple query — if tables don't exist yet, this will error but proves connection
  try {
    const { data, error } = await supabase.from('user_config').select('id').limit(1)
    if (error && error.code === '42P01') {
      console.log('   ✅ Connection OK — tables not yet created')
      return true
    } else if (error) {
      console.log(`   ⚠️  Connection OK but got: ${error.message}`)
      return true
    } else {
      console.log(`   ✅ Connection OK — user_config already exists (${data?.length || 0} rows)`)
      return true
    }
  } catch (e) {
    console.error(`   ❌ Connection FAILED: ${e.message}`)
    return false
  }
}

// ─── Seed categorie ───
async function seedCategories() {
  console.log('\n📦 Seeding finance categories...')
  
  // Check if already seeded
  const { data: existing } = await supabase.from('finance_categories').select('id').limit(1)
  if (existing && existing.length > 0) {
    console.log('   ⏭️  Already seeded — skipping')
    return
  }

  const categories = [
    // Entrate
    { name: 'Stipendio',       type: 'income',  icon: '💰', color: '#3d9970', is_default: true },
    { name: 'Freelance',       type: 'income',  icon: '💻', color: '#4a90d9', is_default: true },
    { name: 'Regalo',          type: 'income',  icon: '🎁', color: '#9b59b6', is_default: true },
    { name: 'Rimborso',        type: 'income',  icon: '🔄', color: '#d4a017', is_default: true },
    { name: '13ª Mensilità',   type: 'income',  icon: '🎄', color: '#3d9970', is_default: true },
    { name: '14ª Mensilità',   type: 'income',  icon: '☀️', color: '#3d9970', is_default: true },
    { name: 'Altro',           type: 'income',  icon: '📋', color: '#95a5a6', is_default: true },
    // Uscite
    { name: 'Casa/Affitto',    type: 'expense', icon: '🏠', color: '#e05252', is_default: true },
    { name: 'Cibo',            type: 'expense', icon: '🍔', color: '#d4a017', is_default: true },
    { name: 'Trasporti',       type: 'expense', icon: '🚗', color: '#4a90d9', is_default: true },
    { name: 'Salute',          type: 'expense', icon: '❤️', color: '#e05252', is_default: true },
    { name: 'Sport',           type: 'expense', icon: '🏋️', color: '#3d9970', is_default: true },
    { name: 'Abbigliamento',   type: 'expense', icon: '👕', color: '#9b59b6', is_default: true },
    { name: 'Intrattenimento', type: 'expense', icon: '🎬', color: '#d4a017', is_default: true },
    { name: 'Utility',         type: 'expense', icon: '⚡', color: '#7f8c8d', is_default: true },
    { name: 'Abbonamenti',     type: 'expense', icon: '📺', color: '#4a90d9', is_default: true },
    { name: 'Risparmio',       type: 'expense', icon: '🐷', color: '#3d9970', is_default: true },
    { name: 'Altro',           type: 'expense', icon: '📋', color: '#95a5a6', is_default: true },
  ]

  const { error } = await supabase.from('finance_categories').insert(categories)
  if (error) {
    console.error(`   ❌ Error: ${error.message}`)
  } else {
    console.log(`   ✅ Inserted ${categories.length} default categories`)
  }
}

// ─── Seed user_config iniziale ───
async function seedUserConfig() {
  console.log('\n👤 Seeding initial user_config...')
  
  const { data: existing } = await supabase.from('user_config').select('id').limit(1)
  if (existing && existing.length > 0) {
    console.log('   ⏭️  Already exists — skipping')
    return
  }

  const { error } = await supabase.from('user_config').insert({})
  if (error) {
    console.error(`   ❌ Error: ${error.message}`)
  } else {
    console.log('   ✅ Created initial user_config row')
  }
}

// ─── Verifica tabelle ───
async function verifyTables() {
  console.log('\n🔍 Verifying tables...')
  
  const tables = [
    'user_config', 'notifications_read', 'recurring_events',
    'calendar_events', 'absences', 'work_sessions',
    'transactions', 'finance_categories',
    'saving_plans', 'saving_movements',
    'workout_sessions', 'weight_log', 'gym_schedules', 'notes'
  ]

  let allOk = true
  for (const t of tables) {
    const { error } = await supabase.from(t).select('id').limit(0)
    if (error) {
      console.log(`   ❌ ${t} — ${error.message}`)
      allOk = false
    } else {
      console.log(`   ✅ ${t}`)
    }
  }

  return allOk
}

// ─── Main ───
async function main() {
  console.log('═══════════════════════════════════════════')
  console.log('  VitaOS 2.1 — Database Setup')
  console.log('═══════════════════════════════════════════\n')

  const connected = await testConnection()
  if (!connected) {
    console.error('\n❌ Cannot connect to Supabase. Check your .env.local')
    process.exit(1)
  }

  // Verifica se le tabelle esistono già
  const tablesOk = await verifyTables()

  if (!tablesOk) {
    console.log('\n⚠️  Some tables are missing!')
    console.log('   Please run the SQL migration file on Supabase SQL Editor:')
    console.log('   → supabase/migrations/001_initial_schema.sql')
    console.log(`   → https://supabase.com/dashboard/project/vqyneoyhusbjetodsbzu/sql/new`)
    console.log('\n   After running the SQL, re-run this script to seed data.')
    process.exit(1)
  }

  // Seed data
  await seedCategories()
  await seedUserConfig()

  console.log('\n═══════════════════════════════════════════')
  console.log('  ✅ Database setup complete!')
  console.log('═══════════════════════════════════════════\n')
}

main().catch(console.error)
