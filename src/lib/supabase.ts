import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})

export type Case = {
  id: string
  title: string
  category: string
  plaintiff: string
  defendant: string
  plaintiff_argument: string
  defendant_argument: string
  verdict: string | null
  verdict_winner: string | null
  verdict_reasoning: string | null
  status: string
  plaintiff_votes: number
  defendant_votes: number
  user_id: string
  created_at: string
}

export type Vote = {
  id: string
  case_id: string
  side: string
  voter_id: string
  user_id: string
  created_at: string
}

export type Profile = {
  id: string
  email: string
  is_supervisor: boolean
  created_at: string
}

export const CATEGORIES = [
  'Relationship',
  'Workplace',
  'Money',
  'Family',
  'Neighbor',
  'Property',
  'Friendship',
  'Other',
] as const

export type Category = (typeof CATEGORIES)[number]
