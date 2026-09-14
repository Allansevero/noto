import { createClient, type SupabaseClient } from "@supabase/supabase-js"

const rawUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  "https://nzihhuvbwbidjwmmbfjr.supabase.co"

const rawKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im56aWhodXZid2JpZGp3bW1iZmpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5MTM1ODgsImV4cCI6MjEwNDQ4OTU4OH0._QrcOPUmCisFz3ch_TJhk4-O4JYKENJ9ahgvU9A_CQc"

export const isSupabaseConfigured = Boolean(
  rawUrl &&
  rawKey &&
  !rawUrl.includes("placeholder")
)

export const supabase: SupabaseClient = createClient(rawUrl, rawKey)
