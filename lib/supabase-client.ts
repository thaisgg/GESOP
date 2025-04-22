import { createClient } from "@supabase/supabase-js"

// Crear un singleton para el cliente de Supabase
let supabaseInstance: ReturnType<typeof createClient> | null = null

export const getSupabaseClient = () => {
  if (!supabaseInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Faltan las variables de entorno de Supabase")
    }

    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey)
  }

  return supabaseInstance
}
