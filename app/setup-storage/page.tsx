"use client"

import { useState } from "react"
import { createClient } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function SetupStoragePage() {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [password, setPassword] = useState("")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [bucketStatus, setBucketStatus] = useState<string | null>(null)

  // Contraseña de administrador
  const ADMIN_PASSWORD = "admin1234"

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true)
      setPassword("")
      checkBucketStatus()
    } else {
      alert("Contrasenya incorrecta")
    }
  }

  const checkBucketStatus = async () => {
    setIsLoading(true)
    setMessage("")
    setError("")

    try {
      // Inicializar cliente de Supabase con claves de servidor
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error("Faltan las variables de entorno de Supabase")
      }

      const supabase = createClient(supabaseUrl, supabaseAnonKey)

      // Verificar si el bucket ya existe
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()

      if (bucketsError) {
        throw bucketsError
      }

      const signaturesBucketExists = buckets?.some((bucket) => bucket.name === "signatures")

      if (signaturesBucketExists) {
        setBucketStatus("El bucket 'signatures' ya existe y está configurado correctamente.")
      } else {
        setBucketStatus("El bucket 'signatures' no existe. Haz clic en 'Configurar Storage' para crearlo.")
      }
    } catch (err) {
      console.error("Error al verificar bucket:", err)
      setError(`Error al verificar bucket: ${(err as Error).message}`)
      setBucketStatus(null)
    } finally {
      setIsLoading(false)
    }
  }

  const setupStorage = async () => {
    setIsLoading(true)
    setMessage("")
    setError("")

    try {
      // Inicializar cliente de Supabase con claves de servidor
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error("Faltan las variables de entorno de Supabase")
      }

      const supabase = createClient(supabaseUrl, supabaseAnonKey)

      // Verificar si el bucket ya existe
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()

      if (bucketsError) {
        throw bucketsError
      }

      const signaturesBucketExists = buckets?.some((bucket) => bucket.name === "signatures")

      if (!signaturesBucketExists) {
        // Crear bucket para firmas
        const { error: createBucketError } = await supabase.storage.createBucket("signatures", {
          public: true,
          fileSizeLimit: 1024 * 1024, // 1MB
          allowedMimeTypes: ["image/png", "image/jpeg"],
        })

        if (createBucketError) {
          throw createBucketError
        }
      }

      // Verificar si la tabla tiene los campos necesarios
      const { error: tableError } = await supabase.rpc("update_formulari_table")

      if (tableError) {
        throw tableError
      }

      setMessage("Storage configurado correctamente. Ya puedes usar el formulario con almacenamiento de firmas.")
      setBucketStatus("El bucket 'signatures' está configurado correctamente.")
    } catch (err) {
      console.error("Error al configurar storage:", err)
      setError(`Error al configurar storage: ${(err as Error).message}`)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto p-4 max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Accés d&apos;administrador</CardTitle>
            <CardDescription>Introdueix la contrasenya per accedir a la configuració</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <label htmlFor="password" className="block mb-2">
                Contrasenya:
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border p-2 rounded w-full mb-4"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleLogin} className="w-full">
              Accedir
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Configuració de Storage</CardTitle>
          <CardDescription>Configura el Storage de Supabase per emmagatzemar les signatures</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            Aquest assistent crearà un bucket a Supabase Storage per emmagatzemar les signatures i actualitzarà la taula
            per utilitzar URLs en lloc de text base64.
          </p>
          <p className="mb-4">Assegura't d'haver configurat correctament les variables d'entorn:</p>
          <ul className="list-disc pl-5 mb-4">
            <li>NEXT_PUBLIC_SUPABASE_URL</li>
            <li>NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
            <li>SUPABASE_SERVICE_ROLE_KEY</li>
          </ul>

          {bucketStatus && (
            <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
              {bucketStatus}
            </div>
          )}

          {message && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">{message}</div>
          )}

          {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
        </CardContent>
        <CardFooter>
          <Button onClick={setupStorage} disabled={isLoading} className="w-full">
            {isLoading ? "Configurant..." : "Configurar Storage"}
          </Button>
        </CardFooter>
      </Card>

      <div className="mt-4">
        <a href="/" className="text-blue-500 underline">
          Tornar al formulari
        </a>
      </div>
    </div>
  )
}
