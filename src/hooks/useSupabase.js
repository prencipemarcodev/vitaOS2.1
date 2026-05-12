import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

/**
 * useSupabase — hook generico per operazioni Supabase con loading/error state.
 */
export function useSupabase() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const query = useCallback(async (fn) => {
    setLoading(true)
    setError(null)
    try {
      const result = await fn(supabase)
      return result
    } catch (err) {
      setError(err.message || 'Errore sconosciuto')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return { query, loading, error, supabase }
}
