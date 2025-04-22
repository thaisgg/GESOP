"use client"

import { useState } from "react"

export default function VisualizarBase64() {
  const [base64Input, setBase64Input] = useState("")
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [debugInfo, setDebugInfo] = useState<string | null>(null)

  // Función para limpiar y preparar el texto base64
  const cleanBase64 = (text: string): string => {
    let cleaned = text.trim()

    // Eliminar espacios, saltos de línea y otros caracteres no válidos
    cleaned = cleaned.replace(/[\r\n\s]+/g, "")

    // Si ya tiene el prefijo data:image, usarlo tal cual
    if (cleaned.startsWith("data:image")) {
      return cleaned
    }

    // Si comienza con caracteres que parecen ser parte de un prefijo parcial, eliminarlos
    if (cleaned.startsWith("data:") || cleaned.startsWith("image")) {
      // Buscar donde comienza realmente el base64
      const base64Start = cleaned.indexOf("base64,")
      if (base64Start !== -1) {
        cleaned = cleaned.substring(base64Start + 7)
      } else {
        // Si no encuentra "base64,", buscar donde podría comenzar el base64 real
        // (después de algún prefijo parcial)
        const possiblePrefixEnd = cleaned.indexOf(",")
        if (possiblePrefixEnd !== -1) {
          cleaned = cleaned.substring(possiblePrefixEnd + 1)
        }
      }
    }

    // Verificar si el texto parece ser base64 válido
    const base64Regex = /^[A-Za-z0-9+/=]+$/
    if (!base64Regex.test(cleaned)) {
      // Intentar extraer solo la parte que parece base64
      const matches = cleaned.match(/[A-Za-z0-9+/=]{20,}/)
      if (matches && matches[0]) {
        cleaned = matches[0]
      }
    }

    // Añadir el prefijo correcto
    return `data:image/png;base64,${cleaned}`
  }

  const handleConvert = () => {
    try {
      setError("")
      setDebugInfo(null)
      setIsProcessing(true)

      if (!base64Input.trim()) {
        setError("Si us plau, introdueix el text base64")
        setIsProcessing(false)
        return
      }

      // Limpiar y preparar el texto base64
      const cleanedBase64 = cleanBase64(base64Input)

      // Mostrar información de depuración
      setDebugInfo(`Longitud del text: ${base64Input.length} caràcters
Longitud després de netejar: ${cleanedBase64.length - 22} caràcters (sense comptar el prefix)
Prefix detectat: ${cleanedBase64.substring(0, 30)}...`)

      // Intentar cargar la imagen para verificar que es válida
      const img = new Image()
      img.onload = () => {
        setImageUrl(cleanedBase64)
        setIsProcessing(false)
      }
      img.onerror = () => {
        setError("El text no és una imatge base64 vàlida. Comprova que has copiat tot el text correctament.")
        setIsProcessing(false)
      }
      img.src = cleanedBase64
    } catch (err) {
      setError(`Error al convertir el text a imatge: ${(err as Error).message}`)
      setIsProcessing(false)
      console.error(err)
    }
  }

  const handleDownload = () => {
    if (!imageUrl) return

    const link = document.createElement("a")
    link.href = imageUrl
    link.download = "signatura.png"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Función para probar con un ejemplo
  const useExample = () => {
    // Este es un pequeño ejemplo de base64 de una imagen simple
    const exampleBase64 =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAApgAAAKYB3X3/OAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAANCSURBVEiJtZZPbBtFFMZ/M7ubXdtdb1xSFyeilBapySVU8h8OoFaooFSqiihIVIpQBKci6KEg9Q6H9kovIHoCIVQJJCKE1ENFjnAgcaSGC6rEnxBwA04Tx43t2FnvDAfjkNibxgHxnWb2e/u992bee7tCa00YFsffekFY+nUzFtjW0LrvjRXrCDIAaPLlW0nHL0SsZtVoaF98mLrx3pdhOqLtYPHChahZcYYO7KvPFxvRl5XPp1sN3adWiD1ZAqD6XYK1b/dvE5IWryTt2udLFedwc1+9kLp+vbbpoDh+6TklxBeAi9TL0taeWpdmZzQDry0AcO+jQ12RyohqqoYoo8RDwJrU+qXkjWtfi8Xxt58BdQuwQs9qC/afLwCw8tnQbqYAPsgxE1S6F3EAIXux2oQFKm0ihMsOF71dHYx+f3NND68ghCu1YIoePPQN1pGRABkJ6Bus96CutRZMydTl+TvuiRW1m3n0eDl0vRPcEysqdXn+jsQPsrHMquGeXEaY4Yk4wxWcY5V/9scqOMOVUFthatyTy8QyqwZ+kDURKoMWxNKr2EeqVKcTNOajqKoBgOE28U4tdQl5p5bwCw7BWquaZSzAPlwjlithJtp3pTImSqQRrb2Z8PHGigD4RZuNX6JYj6wj7O4TFLbCO/Mn/m8R+h6rYSUb3ekokRY6f/YukArN979jcW+V/S8g0eT/N3VN3kTqWbQ428m9/8k0P/1aIhF36PccEl6EhOcAUCrXKZXXWS3XKd2vc/TRBG9O5ELC17MmWubD2nKhUKZa26Ba2+D3P+4/MNCFwg59oWVeYhkzgN/JDR8deKBoD7Y+ljEjGZ0sosXVTvbc6RHirr2reNy1OXd6pJsQ+gqjk8VWFYmHrwBzW/n+uMPFiRwHB2I7ih8ciHFxIkd/3Omk5tCDV1t+2nNu5sxxpDFNx+huNhVT3/zMDz8usXC3ddaHBj1GHj/As08fwTS7Kt1HBTmyN29vdwAw+/wbwLVOJ3uAD1wi/dUH7Qei66PfyuRj4Ik9is+hglfbkbfR3cnZm7chlUWLdwmprtCohX4HUtlOcQjLYCu+fzGJH2QRKvP3UNz8bWk1qMxjGTOMThZ3kvgLI5AzFfo379UAAAAASUVORK5CYII="
    setBase64Input(exampleBase64)
  }

  // Función para intentar reparar automáticamente
  const tryAutoFix = () => {
    if (!base64Input.trim()) {
      setError("Si us plau, introdueix el text base64 primer")
      return
    }

    setIsProcessing(true)
    setError("")
    setDebugInfo(null)

    // Extraer solo los caracteres válidos de base64
    const base64Chars = base64Input.match(/[A-Za-z0-9+/=]+/g)
    if (!base64Chars) {
      setError("No s'han trobat caràcters base64 vàlids")
      setIsProcessing(false)
      return
    }

    // Unir todos los fragmentos válidos
    const cleanedBase64 = `data:image/png;base64,${base64Chars.join("")}`

    // Intentar cargar la imagen
    const img = new Image()
    img.onload = () => {
      setImageUrl(cleanedBase64)
      setBase64Input(cleanedBase64)
      setIsProcessing(false)
    }
    img.onerror = () => {
      setError("No s'ha pogut reparar automàticament. Prova amb l'exemple per veure com ha de ser el format.")
      setIsProcessing(false)
    }
    img.src = cleanedBase64
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-2xl font-bold mb-4">Visualitzador de signatures base64</h1>
      <p className="mb-4">Aquesta eina permet visualitzar les signatures en format base64 que es troben a Supabase.</p>

      <div className="mb-4">
        <label htmlFor="base64Input" className="block mb-2 font-medium">
          Text base64 de la signatura:
        </label>
        <textarea
          id="base64Input"
          value={base64Input}
          onChange={(e) => setBase64Input(e.target.value)}
          className="w-full border p-2 rounded min-h-[100px]"
          placeholder="Enganxa aquí el text base64 de la signatura (comença amb 'data:image/png;base64,' o només la part base64)"
        />
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <button onClick={handleConvert} className="bg-blue-500 text-white px-4 py-2 rounded" disabled={isProcessing}>
          {isProcessing ? "Processant..." : "Visualitzar signatura"}
        </button>

        <button onClick={tryAutoFix} className="bg-yellow-500 text-white px-4 py-2 rounded" disabled={isProcessing}>
          Intentar reparar automàticament
        </button>

        <button onClick={useExample} className="bg-gray-500 text-white px-4 py-2 rounded" disabled={isProcessing}>
          Usar exemple
        </button>

        {imageUrl && (
          <button onClick={handleDownload} className="bg-green-500 text-white px-4 py-2 rounded">
            Descarregar imatge
          </button>
        )}
      </div>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 p-3 rounded mb-4">{error}</div>}

      {debugInfo && (
        <div className="bg-gray-100 border border-gray-300 p-3 rounded mb-4 text-sm font-mono">
          <h3 className="font-bold mb-1">Informació de depuració:</h3>
          <pre className="whitespace-pre-wrap">{debugInfo}</pre>
        </div>
      )}

      {imageUrl && (
        <div className="border p-4 rounded">
          <h2 className="text-xl font-bold mb-2">Signatura:</h2>
          <img src={imageUrl || "/placeholder.svg"} alt="Signatura" className="border max-w-full" />
        </div>
      )}

      <div className="mt-8 bg-gray-100 p-4 rounded">
        <h2 className="text-xl font-bold mb-2">Instruccions millorades:</h2>
        <ol className="list-decimal pl-5 space-y-2">
          <li>Accedeix al panell de Supabase i ves a la secció "Table Editor"</li>
          <li>Selecciona la taula "formulari_respostes"</li>
          <li>Fes clic a la cel·la que conté la signatura (text llarg)</li>
          <li>
            Selecciona <strong>tot</strong> el text (comença amb "data:image/png;base64,")
          </li>
          <li>Copia el text amb Ctrl+C (o Cmd+C en Mac)</li>
          <li>Enganxa el text al camp de dalt i fes clic a "Visualitzar signatura"</li>
          <li>Si no funciona, prova el botó "Intentar reparar automàticament"</li>
          <li>Si encara no funciona, pots provar amb el botó "Usar exemple" per veure com ha de ser el format</li>
        </ol>

        <h3 className="font-bold mt-4 mb-2">Problemes comuns:</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            Assegura't de seleccionar i copiar <strong>tot</strong> el text de la signatura
          </li>
          <li>El text ha de començar amb "data:image/png;base64," o similar</li>
          <li>Si el text és molt llarg, assegura't que no s'ha truncat al copiar-lo</li>
          <li>Prova a copiar directament des de la vista SQL de Supabase en lloc de la vista de taula</li>
        </ul>
      </div>

      <div className="mt-4">
        <a href="/" className="text-blue-500 underline">
          Tornar al formulari
        </a>
      </div>
    </div>
  )
}
