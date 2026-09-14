import { createClient, type SupabaseClient } from "@supabase/supabase-js"

const rawUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  "https://nzihhuvbwbidjwmmbfjr.supabase.co"

const rawKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  ""

export function getServerSupabaseClient(authHeader?: string): SupabaseClient {
  return createClient(rawUrl, rawKey, {
    global: {
      headers: authHeader ? { Authorization: authHeader } : {},
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}
