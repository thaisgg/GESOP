"use client"

import { useState, useEffect } from "react"
import { createClient } from "@supabase/supabase-js"

// Inicializar cliente de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default function FirmasPage() {
  const [submissions, setSubmissions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [password, setPassword] = useState("")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [selectedSignature, setSelectedSignature] = useState<string | null>(null)

  // Contraseña de administrador
  const ADMIN_PASSWORD = "admin1234"

  useEffect(() => {
    // Verificar si hay un token de autenticación en localStorage
    const authToken = localStorage.getItem("formAuthToken")
    if (authToken === ADMIN_PASSWORD) {
      setIsAuthenticated(true)
      fetchData()
    }
  }, [])

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true)
      localStorage.setItem("formAuthToken", password)
      fetchData()
    } else {
      alert("Contrasenya incorrecta")
    }
  }

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("formulari_respostes")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) {
        throw new Error(error.message)
      }

      setSubmissions(data || [])
    } catch (err) {
      console.error("Error al cargar datos:", err)
      setError("Error al carregar les dades")
    } finally {
      setIsLoading(false)
    }
  }

  const showSignature = (signatureUrl: string) => {
    setSelectedSignature(signatureUrl)
  }

  const closeSignature = () => {
    setSelectedSignature(null)
  }

  const downloadSignature = (signatureUrl: string, dni: string) => {
    const link = document.createElement("a")
    link.href = signatureUrl
    link.download = `firma_${dni}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto p-4 max-w-md">
        <h1 className="text-2xl font-bold mb-4">Accés d&apos;administrador</h1>
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
          <button onClick={handleLogin} className="bg-blue-500 text-white px-4 py-2 rounded w-full">
            Accedir
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Galeria de signatures</h1>

      <div className="flex gap-2 mb-6">
        <button onClick={fetchData} className="bg-green-500 text-white px-4 py-2 rounded">
          Actualitzar dades
        </button>
        <a href="/" className="bg-gray-500 text-white px-4 py-2 rounded inline-block">
          Tornar al formulari
        </a>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center p-8">
          <span className="inline-block animate-spin text-2xl mr-2">⟳</span>
          <span>Carregant dades...</span>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 p-3 rounded mb-4">{error}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {submissions.length === 0 ? (
            <p>No hi ha signatures guardades</p>
          ) : (
            submissions.map((item, index) => (
              <div key={index} className="border rounded p-4 bg-white shadow-sm">
                <h3 className="font-bold mb-2">{item.nom}</h3>
                <p className="text-sm mb-1">DNI: {item.dni}</p>
                <p className="text-sm mb-1">
                  Consentiment:{" "}
                  {item.consentiment === "Si"
                    ? "Si, dono la meva conformitat a fer-me el Reconeixement Mèdic"
                    : "No desitjo fer-me el Reconeixement Mèdic"}
                </p>
                <p className="text-sm mb-2">Data: {item.dataenviament}</p>
                <div className="signature-container bg-gray-50 p-2 border rounded">
                  <img
                    src={item.signatura || "/placeholder.svg"}
                    alt={`Signatura de ${item.nom}`}
                    className="max-h-32 mx-auto cursor-pointer"
                    onClick={() => showSignature(item.signatura)}
                  />
                </div>
                <div className="mt-2 flex justify-end">
                  <button
                    onClick={() => downloadSignature(item.signatura, item.dni)}
                    className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
                  >
                    Descarregar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {selectedSignature && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-4 max-w-2xl w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Signatura</h2>
              <button onClick={closeSignature} className="text-2xl">
                &times;
              </button>
            </div>
            <div className="bg-gray-100 p-4 rounded">
              <img
                src={selectedSignature || "/placeholder.svg"}
                alt="Signatura ampliada"
                className="max-w-full mx-auto"
              />
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => downloadSignature(selectedSignature, "signatura")}
                className="bg-green-500 text-white px-4 py-2 rounded"
              >
                Descarregar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
