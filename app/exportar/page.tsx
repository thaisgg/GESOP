"use client"

import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"

// Inicializar cliente de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default function ExportarDatos() {
  const [submissions, setSubmissions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [password, setPassword] = useState("")
  const [isAuthenticated, setIsAuthenticated] = useState(false)

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

  const exportCSV = () => {
    if (submissions.length === 0) {
      alert("No hi ha dades per exportar")
      return
    }

    // Crear contenido CSV
    let csvContent = "data:text/csv;charset=utf-8,"
    csvContent += "Nom,DNI,Data,Consentiment,Signatura URL\n"

    // Añadir filas de datos
    submissions.forEach((item) => {
      const consentimentText =
        item.consentiment === "Si"
          ? "Si, dono la meva conformitat a fer-me el Reconeixement Mèdic"
          : "No desitjo fer-me el Reconeixement Mèdic"
      csvContent += `${item.nom},${item.dni},${item.dataenviament},${consentimentText},${item.signatura}\n`
    })

    // Crear enlace de descarga para el CSV
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", "respostes_formulari.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const printPage = () => {
    window.print()
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
    <div className="container mx-auto p-4 print-container">
      <div className="print-controls">
        <h1 className="text-2xl font-bold mb-4">Exportar dades i signatures</h1>
        <div className="flex gap-2 mb-6">
          <button onClick={exportCSV} className="bg-green-500 text-white px-4 py-2 rounded">
            Descarregar CSV
          </button>
          <button onClick={printPage} className="bg-blue-500 text-white px-4 py-2 rounded">
            Imprimir / Guardar PDF
          </button>
          <a href="/" className="bg-gray-500 text-white px-4 py-2 rounded inline-block">
            Tornar al formulari
          </a>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center p-8">
          <span className="inline-block animate-spin text-2xl mr-2">⟳</span>
          <span>Carregant dades...</span>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 p-3 rounded mb-4">{error}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border">
            <thead>
              <tr>
                <th className="border p-2">#</th>
                <th className="border p-2">Nom</th>
                <th className="border p-2">DNI</th>
                <th className="border p-2">Data</th>
                <th className="border p-2">Consentiment</th>
                <th className="border p-2">Signatura</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((item, index) => (
                <tr key={index}>
                  <td className="border p-2">{index + 1}</td>
                  <td className="border p-2">{item.nom}</td>
                  <td className="border p-2">{item.dni}</td>
                  <td className="border p-2">{item.dataenviament}</td>
                  <td className="border p-2">
                    {item.consentiment === "Si"
                      ? "Si, dono la meva conformitat a fer-me el Reconeixement Mèdic"
                      : "No desitjo fer-me el Reconeixement Mèdic"}
                  </td>
                  <td className="border p-2 signature-cell">
                    <img
                      src={item.signatura || "/placeholder.svg"}
                      alt={`Signatura de ${item.nom}`}
                      className="signature-image"
                      style={{ maxWidth: "200px", maxHeight: "100px" }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <style jsx global>{`
        @media print {
          .print-controls {
            display: none;
          }
          .print-container {
            padding: 0;
          }
          body {
            font-size: 12px;
          }
          .signature-cell {
            padding: 5px;
          }
          .signature-image {
            max-width: 150px !important;
            max-height: 75px !important;
          }
        }
      `}</style>
    </div>
  )
}
