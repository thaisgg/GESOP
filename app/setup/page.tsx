"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function SetupPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const setupDatabase = async () => {
    setIsLoading(true)
    setMessage("")
    setError("")

    try {
      const response = await fetch("/api/create-table")
      const data = await response.json()

      if (response.ok) {
        setMessage("Base de datos configurada correctamente. Ya puedes usar el formulario.")
      } else {
        setError(data.error || "Error al configurar la base de datos")
      }
    } catch (err) {
      setError("Error de conexión. Verifica que la aplicación esté desplegada correctamente.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-4 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Configuración inicial</CardTitle>
          <CardDescription>Configura la base de datos para el formulario de consentimiento médico</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            Este asistente creará la tabla necesaria en tu base de datos Supabase para almacenar las respuestas del
            formulario.
          </p>
          <p className="mb-4">Asegúrate de haber configurado correctamente las variables de entorno:</p>
          <ul className="list-disc pl-5 mb-4">
            <li>NEXT_PUBLIC_SUPABASE_URL</li>
            <li>NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
            <li>SUPABASE_SERVICE_ROLE_KEY</li>
          </ul>

          {message && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">{message}</div>
          )}

          {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
        </CardContent>
        <CardFooter>
          <Button onClick={setupDatabase} disabled={isLoading} className="w-full">
            {isLoading ? "Configurando..." : "Configurar base de datos"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
