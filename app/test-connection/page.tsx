"use client"

import { useState, useEffect } from "react"
import { createClient } from "@supabase/supabase-js"

export default function TestConnection() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")
  const [tableExists, setTableExists] = useState(false)
  const [envVars, setEnvVars] = useState({
    url: "",
    anonKey: "",
  })

  useEffect(() => {
    async function checkConnection() {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

        setEnvVars({
          url: supabaseUrl ? "✅ Configurada" : "❌ No configurada",
          anonKey: supabaseAnonKey ? "✅ Configurada" : "❌ No configurada",
        })

        if (!supabaseUrl || !supabaseAnonKey) {
          setStatus("error")
          setMessage("Faltan las variables de entorno de Supabase")
          return
        }

        const supabase = createClient(supabaseUrl, supabaseAnonKey)

        // Comprobar conexión
        const { data, error } = await supabase.from("formulari_respostes").select("count()", { count: "exact" })

        if (error) {
          if (error.code === "PGRST116") {
            // La tabla no existe
            setTableExists(false)
            setStatus("error")
            setMessage("La tabla formulari_respostes no existe. Ejecuta el SQL para crearla.")
          } else {
            throw error
          }
        } else {
          // Conexión exitosa
          setTableExists(true)
          setStatus("success")
          setMessage(`Conexión exitosa. La tabla existe y contiene ${data[0].count} registros.`)
        }
      } catch (error) {
        console.error("Error al comprobar conexión:", error)
        setStatus("error")
        setMessage(`Error de conexión: ${(error as Error).message}`)
      }
    }

    checkConnection()
  }, [])

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Test de conexión a Supabase</h1>

      <div
        className={`p-4 rounded-md ${
          status === "loading"
            ? "bg-yellow-100 border border-yellow-400"
            : status === "success"
              ? "bg-green-100 border border-green-400"
              : "bg-red-100 border border-red-400"
        }`}
      >
        <h2 className="font-bold">
          {status === "loading" ? "Comprobando conexión..." : status === "success" ? "Conexión exitosa" : "Error"}
        </h2>
        <p className="mt-2">{message}</p>

        {!tableExists && (
          <div className="mt-4 p-4 bg-white rounded border">
            <h3 className="font-bold">SQL para crear la tabla:</h3>
            <pre className="bg-gray-100 p-2 mt-2 overflow-x-auto text-sm">
              {`CREATE TABLE IF NOT EXISTS formulari_respostes (
  id BIGSERIAL PRIMARY KEY,
  nom TEXT NOT NULL,
  dni TEXT NOT NULL,
  dataenviament TEXT NOT NULL,
  consentiment TEXT NOT NULL,
  signatura TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Configurar políticas de seguridad RLS (Row Level Security)
ALTER TABLE formulari_respostes ENABLE ROW LEVEL SECURITY;

-- Crear política para permitir inserciones anónimas
CREATE POLICY insert_policy ON formulari_respostes
  FOR INSERT TO anon
  WITH CHECK (true);

-- Crear política para permitir lectura anónima
CREATE POLICY select_policy ON formulari_respostes
  FOR SELECT TO anon
  USING (true);`}
            </pre>
          </div>
        )}
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-bold mb-2">Variables de entorno detectadas:</h2>
        <ul className="list-disc pl-5">
          <li>NEXT_PUBLIC_SUPABASE_URL: {envVars.url}</li>
          <li>NEXT_PUBLIC_SUPABASE_ANON_KEY: {envVars.anonKey}</li>
        </ul>
      </div>

      <div className="mt-8">
        <a href="/" className="text-blue-500 underline">
          Volver al formulario
        </a>
      </div>
    </div>
  )
}
