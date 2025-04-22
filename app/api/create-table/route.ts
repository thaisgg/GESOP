import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Inicializar cliente de Supabase con claves de servidor
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: "Faltan las variables de entorno de Supabase" }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Crear tabla si no existe
    const { error } = await supabase.rpc("create_formulari_table")

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Tabla creada correctamente" })
  } catch (error) {
    console.error("Error al crear la tabla:", error)
    return NextResponse.json({ error: "Error al crear la tabla" }, { status: 500 })
  }
}
