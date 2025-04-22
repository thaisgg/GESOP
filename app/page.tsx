"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import Head from "next/head"
import Script from "next/script"
import { createClient } from "@supabase/supabase-js"

// Inicializar cliente de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default function ConsentimientForm() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const signaturePadRef = useRef<any>(null)
  const [adminPanelVisible, setAdminPanelVisible] = useState(false)
  const [respuestasVisible, setRespuestasVisible] = useState(false)
  const [submissions, setSubmissions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedSignature, setSelectedSignature] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    nom: "",
    dni: "",
    dataenviament: "",
    consentiment: "",
  })

  // Contraseña de administrador
  const ADMIN_PASSWORD = "admin1234"

  useEffect(() => {
    // Establecer fecha actual
    setFormattedDate()

    // Inicializar el pad de firma después de cargar el script
    const initializeSignaturePad = () => {
      if (!canvasRef.current || typeof window === "undefined" || !(window as any).SignaturePad) return

      // Destruir instancia previa si existe
      if (signaturePadRef.current) {
        signaturePadRef.current.off()
      }

      // Crear nueva instancia
      signaturePadRef.current = new (window as any).SignaturePad(canvasRef.current, {
        backgroundColor: "rgb(255, 255, 255)",
        penColor: "rgb(0, 0, 0)",
        minWidth: 1,
        maxWidth: 2.5,
        throttle: 16,
        velocityFilterWeight: 0.7,
      })

      // Ajustar tamaño del canvas
      resizeCanvas()
    }

    // Configurar listeners para redimensionamiento
    window.addEventListener("resize", resizeCanvas)
    window.addEventListener("orientationchange", () => {
      setTimeout(resizeCanvas, 200)
    })

    // Inicializar después de un pequeño retardo
    const timer = setTimeout(() => {
      initializeSignaturePad()
    }, 500)

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      window.removeEventListener("orientationchange", resizeCanvas)
      clearTimeout(timer)
    }
  }, [])

  // Función para ajustar el tamaño del canvas
  const resizeCanvas = () => {
    if (!canvasRef.current || !signaturePadRef.current) return

    const canvas = canvasRef.current
    const container = canvas.parentElement
    if (!container) return

    const ratio = Math.max(window.devicePixelRatio || 1, 1)

    canvas.width = container.clientWidth * ratio
    canvas.height = container.clientHeight * ratio
    canvas.style.width = `${container.clientWidth}px`
    canvas.style.height = `${container.clientHeight}px`

    const ctx = canvas.getContext("2d")
    if (ctx) {
      ctx.scale(ratio, ratio)
    }

    // Guardar y restaurar datos de firma
    const data = signaturePadRef.current.toData()
    signaturePadRef.current.clear()
    signaturePadRef.current.fromData(data)
  }

  // Establecer fecha actual
  const setFormattedDate = () => {
    const today = new Date()
    const day = String(today.getDate()).padStart(2, "0")
    const month = String(today.getMonth() + 1).padStart(2, "0")
    const year = today.getFullYear()
    const formattedDate = `${day}/${month}/${year}`

    setFormData((prev) => ({ ...prev, dataenviament: formattedDate }))

    const dateField = document.getElementById("dataEnviament") as HTMLInputElement
    if (dateField) {
      dateField.value = formattedDate
    }
  }

  // Limpiar firma
  const clearSignature = () => {
    if (signaturePadRef.current) {
      signaturePadRef.current.clear()
    }
  }

  // Manejar cambios en los campos del formulario
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Manejar cambios en el campo DNI
  const handleDniInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const numericPart = value.slice(0, 8).replace(/[^0-9]/g, "")
    const letterPart = value.length > 8 ? value.slice(8, 9).replace(/[^a-zA-Z]/g, "") : ""
    const newValue = numericPart + letterPart
    e.target.value = newValue
    setFormData((prev) => ({ ...prev, dni: newValue }))
  }

  // Manejar cambio en radio buttons
  const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, consentiment: e.target.value }))
  }

  // Función para reducir el tamaño de la imagen base64
  const resizeSignatureBase64 = (base64: string, maxWidth = 300, maxHeight = 150): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement("canvas")
        let width = img.width
        let height = img.height

        // Calcular nuevas dimensiones manteniendo la proporción
        if (width > maxWidth) {
          height = Math.round(height * (maxWidth / width))
          width = maxWidth
        }
        if (height > maxHeight) {
          width = Math.round(width * (maxHeight / height))
          height = maxHeight
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext("2d")
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height)
          resolve(canvas.toDataURL("image/png", 0.7)) // Calidad reducida a 0.7
        } else {
          resolve(base64) // Fallback al original si hay error
        }
      }
      img.onerror = () => resolve(base64) // Fallback al original si hay error
      img.src = base64
    })
  }

  // Validar y enviar formulario con manejo mejorado de errores
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setDebugInfo(null)

    let isValid = true
    const errorMessages = []

    // Validar nombre
    if (!formData.nom.trim()) {
      document.getElementById("nomError")!.style.display = "block"
      isValid = false
      errorMessages.push("Falta el nombre")
    } else {
      document.getElementById("nomError")!.style.display = "none"
    }

    // Validar DNI
    if (!formData.dni || !/^\d{8}[a-zA-Z]$/.test(formData.dni)) {
      document.getElementById("dniError")!.style.display = "block"
      isValid = false
      errorMessages.push("DNI inválido")
    } else {
      document.getElementById("dniError")!.style.display = "none"
    }

    // Validar consentimiento
    if (!formData.consentiment) {
      document.getElementById("consentimentError")!.style.display = "block"
      isValid = false
      errorMessages.push("Falta seleccionar consentimiento")
    } else {
      document.getElementById("consentimentError")!.style.display = "none"
    }

    // Validar firma
    if (signaturePadRef.current && signaturePadRef.current.isEmpty()) {
      document.getElementById("signatureError")!.style.display = "block"
      isValid = false
      errorMessages.push("Falta la firma")
    } else {
      document.getElementById("signatureError")!.style.display = "none"
    }

    if (!isValid) {
      setDebugInfo(`Errores de validación: ${errorMessages.join(", ")}`)
      return
    }

    setIsSubmitting(true)
    setDebugInfo("Procesando formulario...")

    try {
      // Obtener firma y reducir su tamaño
      let signatureBase64 = signaturePadRef.current.toDataURL("image/png", 0.7)
      setDebugInfo("Firma capturada. Reduciendo tamaño...")

      // Reducir tamaño de la firma
      signatureBase64 = await resizeSignatureBase64(signatureBase64)

      setDebugInfo("Firma procesada. Preparando datos para enviar...")

      // Preparar datos para guardar
      const dataToSend = {
        nom: formData.nom,
        dni: formData.dni,
        dataenviament: formData.dataenviament,
        consentiment: formData.consentiment,
        signatura: signatureBase64,
      }

      setDebugInfo("Enviando datos a Supabase...")

      // Guardar en Supabase - ENFOQUE DIRECTO
      const { data, error } = await supabase.from("formulari_respostes").insert([dataToSend])

      if (error) {
        setDebugInfo(`Error de Supabase: ${error.message} (${error.code})`)
        throw new Error(`Error al guardar los datos: ${error.message}`)
      }

      setDebugInfo("Datos guardados correctamente")
      alert("Formulari enviat correctament!")

      // Resetear formulario
      setFormData({
        nom: "",
        dni: "",
        dataenviament: new Date().toLocaleDateString("es-ES"),
        consentiment: "",
      })
      clearSignature()

      // Resetear campos del formulario
      const form = document.getElementById("consentForm") as HTMLFormElement
      form.reset()
      setFormattedDate()
    } catch (error) {
      console.error("Error al procesar el formulario:", error)
      setDebugInfo(`Error final: ${(error as Error).message}`)
      alert(`Hi ha hagut un problema en desar les dades. Si us plau, torna-ho a provar.`)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Mostrar modal de admin
  const showAdminModal = () => {
    const modal = document.getElementById("adminModal") as HTMLDivElement
    if (modal) {
      modal.style.display = "block"
    }
  }

  // Cerrar modal de admin
  const closeAdminModal = () => {
    const modal = document.getElementById("adminModal") as HTMLDivElement
    if (modal) {
      modal.style.display = "none"
    }
  }

  // Login de admin
  const handleAdminLogin = async () => {
    const passwordInput = document.getElementById("adminPassword") as HTMLInputElement
    const password = passwordInput.value

    if (password === ADMIN_PASSWORD) {
      closeAdminModal()
      setAdminPanelVisible(true)
      passwordInput.value = ""

      // Cargar datos de Supabase
      await fetchSubmissions()
    } else {
      alert("Contrasenya incorrecta")
    }
  }

  // Cargar datos de Supabase
  const fetchSubmissions = async () => {
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
    } catch (error) {
      console.error("Error al cargar datos:", error)
      alert("Error al carregar les dades")
    } finally {
      setIsLoading(false)
    }
  }

  // Alternar visualización de respuestas
  const toggleRespuestas = () => {
    setRespuestasVisible(!respuestasVisible)
  }

  // Mostrar firma en modal
  const showSignature = (signatureUrl: string) => {
    setSelectedSignature(signatureUrl)
    const modal = document.getElementById("signatureModal") as HTMLDivElement
    if (modal) {
      modal.style.display = "block"
    }
  }

  // Cerrar modal de firma
  const closeSignatureModal = () => {
    const modal = document.getElementById("signatureModal") as HTMLDivElement
    if (modal) {
      modal.style.display = "none"
    }
    setSelectedSignature(null)
  }

  // Descargar firma como imagen
  const downloadSignature = (signatureUrl: string, dni: string) => {
    const link = document.createElement("a")
    link.href = signatureUrl
    link.download = `firma_${dni}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Exportar datos como CSV simple (sin firmas)
  const exportData = () => {
    if (submissions.length === 0) {
      alert("No hi ha dades per exportar")
      return
    }

    // Crear contenido CSV
    let csvContent = "data:text/csv;charset=utf-8,"
    csvContent += "Nom,DNI,Data,Consentiment\n"

    // Añadir filas de datos
    submissions.forEach((item) => {
      csvContent += `${item.nom},${item.dni},${item.dataenviament},${item.consentiment}\n`
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

  // Eliminar todos los datos
  const deleteAllData = async () => {
    if (confirm("Estàs segur que vols eliminar totes les dades? Aquesta acció no es pot desfer.")) {
      setIsLoading(true)

      try {
        // Eliminar registros de la base de datos
        const { error } = await supabase.from("formulari_respostes").delete().gt("id", 0)

        if (error) {
          throw new Error(error.message)
        }

        setSubmissions([])
        setRespuestasVisible(false)
        alert("Totes les dades han estat eliminades")
      } catch (error) {
        console.error("Error al eliminar datos:", error)
        alert("Error al eliminar les dades")
      } finally {
        setIsLoading(false)
      }
    }
  }

  // Cerrar modal al hacer clic fuera
  const handleWindowClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const modal = document.getElementById("adminModal")
    if (event.target === modal) {
      closeAdminModal()
    }

    const signatureModal = document.getElementById("signatureModal")
    if (event.target === signatureModal) {
      closeSignatureModal()
    }
  }

  // Refrescar datos
  const refreshData = async () => {
    await fetchSubmissions()
    alert("Dades actualitzades correctament")
  }

  // Verificar conexión a Supabase
  const testConnection = async () => {
    try {
      setDebugInfo("Comprobando conexión a Supabase...")

      // Verificar que tenemos las variables de entorno
      if (!supabaseUrl || !supabaseAnonKey) {
        setDebugInfo("Error: Faltan variables de entorno de Supabase")
        return false
      }

      // Probar conexión básica
      const { data, error } = await supabase.from("formulari_respostes").select("id").limit(1)

      if (error) {
        setDebugInfo(`Error de conexión: ${error.message} (${error.code})`)
        return false
      }

      // Probar inserción de un registro de prueba
      const testData = {
        nom: "Test Connection",
        dni: "12345678Z",
        dataenviament: new Date().toLocaleDateString(),
        consentiment: "Si",
        signatura:
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      }

      const { error: insertError } = await supabase.from("formulari_respostes").insert([testData])

      if (insertError) {
        setDebugInfo(`Error al insertar datos de prueba: ${insertError.message} (${insertError.code})`)
        return false
      }

      setDebugInfo("Conexión exitosa. Se ha insertado un registro de prueba correctamente.")
      return true
    } catch (err) {
      setDebugInfo(`Error inesperado: ${(err as Error).message}`)
      return false
    }
  }

  return (
    <>
      <Head>
        <title>Acceptació/Renúncia reconeixement mèdic</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/signature_pad/4.1.5/signature_pad.umd.min.js"
        strategy="beforeInteractive"
        onLoad={() => {
          if (canvasRef.current && typeof window !== "undefined" && (window as any).SignaturePad) {
            signaturePadRef.current = new (window as any).SignaturePad(canvasRef.current, {
              backgroundColor: "rgb(255, 255, 255)",
              penColor: "rgb(0, 0, 0)",
              minWidth: 1,
              maxWidth: 2.5,
              throttle: 16,
              velocityFilterWeight: 0.7,
            })
            resizeCanvas()
          }
        }}
      />

      <div className="container">
        <h1>Acceptació/Renúncia reconeixement mèdic</h1>

        <form id="consentForm" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="nom">Nom i Cognoms:</label>
            <input type="text" id="nom" name="nom" value={formData.nom} onChange={handleInputChange} required />
            <div className="error" id="nomError">
              Aquest camp és obligatori
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="dni">DNI (8 números + lletra):</label>
            <input
              type="text"
              id="dni"
              name="dni"
              value={formData.dni}
              maxLength={9}
              required
              onChange={handleDniInput}
            />
            <div className="error" id="dniError">
              Si us plau, introdueix 8 números i una lletra
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="dataEnviament">Data enviament:</label>
            <input type="text" id="dataEnviament" name="dataEnviament" value={formData.dataenviament} readOnly />
          </div>

          <p className="description">
            Jo, com a treballador/a de l'empresa Gabinet d'Estudis Socials i Opinió Pública declaro que, havent estat
            informat dels riscos derivats del meu lloc de treball i de la possibilitat de realitzar-me un reconeixement
            mèdic específic per a determinar possibles danys derivats d'aquests riscos, d'acord amb l'Art. 22 de la Llei
            de Prevenció de Riscos Laborals
          </p>

          <div className="form-group">
            <label>Consentiment:</label>
            <div className="radio-group">
              <div>
                <input
                  type="radio"
                  id="consentimentSi"
                  name="consentiment"
                  value="Si"
                  checked={formData.consentiment === "Si"}
                  onChange={handleRadioChange}
                  required
                />
                <label htmlFor="consentimentSi">Si, dono la meva conformitat a fer-me el RM</label>
              </div>
              <div>
                <input
                  type="radio"
                  id="consentimentNo"
                  name="consentiment"
                  value="No"
                  checked={formData.consentiment === "No"}
                  onChange={handleRadioChange}
                />
                <label htmlFor="consentimentNo">No desitjo fer-me el RM</label>
              </div>
            </div>
            <div className="error" id="consentimentError">
              Si us plau, selecciona una opció
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="signature">Signatura:</label>
            <div className="signature-container">
              <canvas id="signaturePad" ref={canvasRef} className="signature-pad"></canvas>
            </div>
            <div className="error" id="signatureError">
              La signatura és obligatòria
            </div>
            <button type="button" id="clearSignature" onClick={clearSignature} style={{ marginTop: "10px" }}>
              Esborrar signatura
            </button>
          </div>

          <div style={{ marginTop: "20px" }}>
            <button type="submit" id="submitBtn" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <span className="inline-block mr-2">Enviant...</span>
                  <span className="inline-block animate-spin">⟳</span>
                </>
              ) : (
                "Enviar"
              )}
            </button>
            <button type="button" onClick={testConnection} style={{ backgroundColor: "#3498db" }}>
              Provar connexió
            </button>
          </div>

          {debugInfo && (
            <div
              style={{
                marginTop: "10px",
                padding: "10px",
                backgroundColor: "#f8f9fa",
                borderRadius: "4px",
                fontSize: "12px",
              }}
            >
              <strong>Informació de diagnòstic:</strong>
              <pre style={{ whiteSpace: "pre-wrap", margin: "5px 0 0 0" }}>{debugInfo}</pre>
            </div>
          )}
        </form>
      </div>

      {/* Botón Admin discreto */}
      <button id="adminBtn" onClick={showAdminModal}>
        Admin
      </button>

      {/* Modal de autenticación */}
      <div id="adminModal" className="modal" onClick={handleWindowClick as any}>
        <div className="modal-content">
          <span className="close" onClick={closeAdminModal}>
            &times;
          </span>
          <h2>Accés d&apos;administrador</h2>
          <div className="form-group">
            <label htmlFor="adminPassword">Contrasenya:</label>
            <input type="password" id="adminPassword" />
          </div>
          <button id="loginBtn" onClick={handleAdminLogin}>
            Accedir
          </button>
        </div>
      </div>

      {/* Modal para visualizar firma */}
      <div id="signatureModal" className="modal">
        <div className="modal-content signature-modal-content">
          <span className="close" onClick={closeSignatureModal}>
            &times;
          </span>
          <h2>Signatura</h2>
          {selectedSignature && (
            <>
              <img
                src={selectedSignature || "/placeholder.svg"}
                alt="Signatura"
                style={{ maxWidth: "100%", marginBottom: "15px" }}
              />
              <button onClick={() => downloadSignature(selectedSignature, "signatura")}>Descarregar signatura</button>
            </>
          )}
        </div>
      </div>

      {/* Panel de administrador */}
      {adminPanelVisible && (
        <div id="adminPanel" style={{ display: "block" }}>
          <h2>Panell d&apos;administrador</h2>
          <button onClick={refreshData} style={{ backgroundColor: "#4CAF50" }} disabled={isLoading}>
            {isLoading ? (
              <>
                <span className="inline-block mr-2">Actualitzant...</span>
                <span className="inline-block animate-spin">⟳</span>
              </>
            ) : (
              "Actualitzar dades"
            )}
          </button>
          <button id="showResponsesBtn" onClick={toggleRespuestas} disabled={isLoading}>
            {respuestasVisible ? "Ocultar respostes" : "Mostrar totes les respostes"}
          </button>
          <a
            href="/exportar"
            target="_blank"
            className="admin-button"
            style={{ backgroundColor: "#3498db" }}
            rel="noreferrer"
          >
            Exportar amb signatures
          </a>
          <button id="exportDataBtn" onClick={exportData} disabled={isLoading}>
            Exportar CSV simple
          </button>
          <a
            href="/firmas"
            target="_blank"
            className="admin-button"
            style={{ backgroundColor: "#27ae60" }}
            rel="noreferrer"
          >
            Galeria de signatures
          </a>
          <a
            href="/visualizar-base64"
            target="_blank"
            className="admin-button"
            style={{ backgroundColor: "#9b59b6" }}
            rel="noreferrer"
          >
            Convertir base64 a imatge
          </a>
          <button id="deleteAllBtn" onClick={deleteAllData} disabled={isLoading}>
            Eliminar totes les dades
          </button>

          {respuestasVisible && (
            <div id="respuestasContainer" style={{ display: "block" }}>
              <h3>Respostes guardades</h3>
              {isLoading ? (
                <div className="flex justify-center items-center p-8">
                  <span className="inline-block animate-spin text-2xl mr-2">⟳</span>
                  <span>Carregant dades...</span>
                </div>
              ) : (
                <div id="respuestasList">
                  {submissions.length === 0 ? (
                    <p>No hi ha respostes guardades</p>
                  ) : (
                    submissions.map((item, index) => (
                      <div key={index} className="respuesta-item">
                        <h3>Resposta #{index + 1}</h3>
                        <p>
                          <strong>Nom:</strong> {item.nom}
                        </p>
                        <p>
                          <strong>DNI:</strong> {item.dni}
                        </p>
                        <p>
                          <strong>Data:</strong> {item.dataenviament}
                        </p>
                        <p>
                          <strong>Consentiment:</strong>{" "}
                          {item.consentiment === "Si"
                            ? "Si, dono la meva conformitat a fer-me el Reconeixement Mèdic"
                            : "No desitjo fer-me el Reconeixement Mèdic"}
                        </p>
                        <p>
                          <strong>Signatura:</strong>
                        </p>
                        <div className="signature-actions">
                          <img
                            src={item.signatura || "/placeholder.svg"}
                            style={{ maxWidth: "100%", border: "1px solid #ddd", marginBottom: "10px" }}
                            alt="Signatura"
                          />
                          <div className="signature-buttons">
                            <button
                              className="signature-button"
                              onClick={() => showSignature(item.signatura)}
                              style={{ backgroundColor: "#3498db", marginRight: "5px" }}
                            >
                              Veure
                            </button>
                            <button
                              className="signature-button"
                              onClick={() => downloadSignature(item.signatura, item.dni)}
                              style={{ backgroundColor: "#2ecc71" }}
                            >
                              Descarregar
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  )
}
