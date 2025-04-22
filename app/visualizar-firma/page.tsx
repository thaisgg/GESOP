"use client"

import { useState } from "react"
import { createClient } from "@supabase/supabase-js"

// Inicializar cliente de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default function VisualizarFirma() {
  const [dni, setDni] = useState("")
  const [firma, setFirma] = useState<string | null>(null)
  const [nombre, setNombre] = useState("")
  const [fecha, setFecha] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const buscarFirma = async () => {
    if (!dni) {
      setError("Introdueix un DNI per buscar")
      return
    }

    setIsLoading(true)
    setError("")
    setFirma(null)

    try {
      const { data, error } = await supabase
        .from("formulari_respostes")
        .select("*")
        .eq("dni", dni)
        .order("created_at", { ascending: false })
        .limit(1)

      if (error) {
        throw new Error(error.message)
      }

      if (data && data.length > 0) {
        setFirma(data[0].signatura)
        setNombre(data[0].nom)
        setFecha(data[0].dataenviament)
      } else {
        setError("No s'ha trobat cap firma amb aquest DNI")
      }
    } catch (error) {
      console.error("Error al buscar firma:", error)
      setError("Error al buscar la firma")
    } finally {
      setIsLoading(false)
    }
  }

  const descargarFirma = () => {
    if (!firma) return

    const link = document.createElement("a")
    link.href = firma
    link.download = `firma_${dni.replace(/[^a-zA-Z0-9]/g, "")}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Visualitzador de Signatures</h1>
      <p className="mb-4">
        Aquesta eina permet visualitzar les signatures emmagatzemades a Supabase introduint el DNI del signant.
      </p>

      <div className="mb-4">
        <label htmlFor="dni" className="block mb-2">
          DNI:
        </label>
        <div className="flex">
          <input
            type="text"
            id="dni"
            value={dni}
            onChange={(e) => setDni(e.target.value)}
            className="border p-2 rounded mr-2 flex-grow"
            placeholder="Introdueix el DNI (8 números + lletra)"
          />
          <button onClick={buscarFirma} disabled={isLoading} className="bg-blue-500 text-white px-4 py-2 rounded">
            {isLoading ? "Buscant..." : "Buscar"}
          </button>
        </div>
      </div>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 p-3 rounded mb-4">{error}</div>}

      {firma && (
        <div className="bg-gray-100 p-4 rounded border">
          <h2 className="text-xl font-bold mb-2">Signatura trobada</h2>
          <p>
            <strong>Nom:</strong> {nombre}
          </p>
          <p>
            <strong>DNI:</strong> {dni}
          </p>
          <p>
            <strong>Data:</strong> {fecha}
          </p>
          <div className="mt-4">
            <img src={firma || "/placeholder.svg"} alt="Signatura" className="border max-w-full" />
          </div>
          <button onClick={descargarFirma} className="bg-green-500 text-white px-4 py-2 rounded mt-4">
            Descarregar signatura
          </button>
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-xl font-bold mb-2">Instruccions per a Supabase</h2>
        <p className="mb-2">Si necessites visualitzar les signatures directament a Supabase, segueix aquests passos:</p>
        <ol className="list-decimal pl-5 space-y-2">
          <li>Accedeix al panell de Supabase i ves a la secció "Table Editor"</li>
          <li>Selecciona la taula "formulari_respostes"</li>
          <li>
            Quan vegis el text llarg de la signatura (que comença amb "data:image/png;base64,..."), copia aquest text
          </li>
          <li>Obre una nova pestanya al navegador i enganxa el text a la barra d'adreces</li>
          <li>Prem Enter i el navegador mostrarà la imatge de la signatura</li>
        </ol>
      </div>

      <div className="mt-4">
        <a href="/" className="text-blue-500 underline">
          Tornar al formulari
        </a>
      </div>
    </div>
  )
}
