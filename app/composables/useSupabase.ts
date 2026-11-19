import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '~/types/database'

// Client unique pour toute l'app (singleton au niveau du module)
let client: SupabaseClient<Database> | null = null

export function useSupabase(): SupabaseClient<Database> {
  if (!client) {
    const { supabaseUrl, supabaseKey } = useRuntimeConfig().public
    client = createClient<Database>(supabaseUrl, supabaseKey, {
      // PKCE : flux OAuth recommandé pour les SPA (échange d'un code, pas de token dans l'URL)
      auth: { flowType: 'pkce', detectSessionInUrl: true, persistSession: true },
    })
  }
  return client
}
