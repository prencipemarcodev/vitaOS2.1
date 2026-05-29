import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[VitaOS] Supabase env vars not set — running in offline mode')
}

// ── Custom fetch con retry per errori TLS/rete transitori (Safari PWA) ──
// Safari in modalità standalone PWA può perdere la connessione TLS
// momentaneamente — ritentativi automatici prevengono errori a cascata
const fetchWithRetry = async (url, options = {}, retries = 3, backoff = 800) => {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(url, options)
      return res
    } catch (err) {
      const isLast = attempt === retries - 1
      if (isLast) throw err
      // Aspetta prima di ritentare (backoff esponenziale)
      await new Promise(r => setTimeout(r, backoff * (attempt + 1)))
    }
  }
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder',
  {
    auth: {
      persistSession:    true,
      autoRefreshToken:  true,
      detectSessionInUrl: false,
      flowType:          'pkce',
    },
    global: {
      fetch: fetchWithRetry,
    },
  }
)

