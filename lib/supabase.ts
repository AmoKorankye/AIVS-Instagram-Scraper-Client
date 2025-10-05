import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vfixvelgubfcznsyinhe.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmaXh2ZWxndWJmY3puc3lpbmhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MjgyMjMsImV4cCI6MjA3NDQwNDIyM30.AFxs_lWiCsiKyRb4Xev5h48579dX0ouXiJro8WJV5QM'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
