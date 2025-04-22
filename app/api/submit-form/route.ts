import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    // Obtener datos del formulario
    const formData = await request.json()

    // Validar datos
    if (!formData.nom || !formData.dni || !formData.dataenviament || !formData.consentiment || !formData.signatura) {
      return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 })
    }

    // Inicializar cliente de Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: "Faltan las variables de entorno de Supabase" }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Insertar datos en la tabla
    const { data, error } = await supabase.from("formulari_consentiment").insert([formData]).select()

    if (error) {
      console.error("Error al insertar datos:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Error en la API:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
