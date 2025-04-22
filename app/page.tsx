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

  // Función para convertir base64 a Blob
  const base64ToBlob = (base64: string): Blob => {
    try {
      // Extraer la parte de datos del base64
      const parts = base64.split(";base64,")
      const contentType = parts[0].split(":")[1]
      const raw = window.atob(parts[1])
      const rawLength = raw.length
      const uInt8Array = new Uint8Array(rawLength)

      for (let i = 0; i < rawLength; ++i) {
        uInt8Array[i] = raw.charCodeAt(i)
      }

      return new Blob([uInt8Array], { type: contentType })
    } catch (error) {
      console.error("Error al convertir base64 a Blob:", error)
      throw new Error("Error al procesar la firma")
    }
  }

  // Función para intentar crear el bucket si no existe
  const ensureSignaturesBucketExists = async (): Promise<boolean> => {
    try {
      // Verificar si el bucket ya existe
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()

      if (bucketsError) {
        console.error("Error al listar buckets:", bucketsError)
        return false
      }

      const signaturesBucketExists = buckets?.some((bucket) => bucket.name === "signatures")

      if (!signaturesBucketExists) {
        // Intentar crear el bucket
        const { error: createError } = await supabase.storage.createBucket("signatures", {
          public: true,
          fileSizeLimit: 1024 * 1024, // 1MB
        })

        if (createError) {
          console.error("Error al crear bucket:", createError)
          return false
        }

        console.log("Bucket 'signatures' creado correctamente")
      }

      return true
    } catch (error) {
      console.error("Error al verificar/crear bucket:", error)
      return false
    }
  }

  // Función para subir firma a Supabase Storage con manejo mejorado de errores
  const uploadSignature = async (signatureBase64: string, dni: string): Promise<string> => {
    try {
      // Asegurar que el bucket existe
      const bucketExists = await ensureSignaturesBucketExists()

      if (!bucketExists) {
        console.warn("No se pudo verificar/crear el bucket. Usando base64 directamente.")
        return signatureBase64 // Fallback a usar base64 directamente
      }

      // Convertir base64 a Blob
      const blob = base64ToBlob(signatureBase64)

      // Generar un nombre único para el archivo
      const fileName = `firma_${dni.replace(/[^a-zA-Z0-9]/g, "")}_${Date.now()}.png`

      // Subir a Supabase Storage
      const { data, error } = await supabase.storage.from("signatures").upload(fileName, blob, {
        contentType: "image/png",
        upsert: true,
      })

      if (error) {
        console.error("Error al subir firma a Storage:", error)
        // Si falla la subida, devolver el base64 como fallback
        return signatureBase64
      }

      // Obtener la URL pública del archivo
      const { data: urlData } = supabase.storage.from("signatures").getPublicUrl(fileName)

      return urlData.publicUrl
    } catch (error) {
      console.error("Error en uploadSignature:", error)
      // En caso de cualquier error, usar el base64 directamente
      return signatureBase64
    }
  }

  // Validar y enviar formulario con manejo mejorado de errores
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    let isValid = true

    // Validar nombre
    const nomInput = document.getElementById("nom") as HTMLInputElement
    const nom = nomInput.value.trim()
    const nomError = document.getElementById("nomError") as HTMLDivElement

    if (!nom) {
      nomError.style.display = "block"
      isValid = false
    } else {
      nomError.style.display = "none"
    }

    // Validar DNI
    const dniInput = document.getElementById("dni") as HTMLInputElement
    const dni = dniInput.value.trim()
    const dniError = document.getElementById("dniError") as HTMLDivElement

    if (!dni || !/^\d{8}[a-zA-Z]$/.test(dni)) {
      dniError.style.display = "block"
      isValid = false
    } else {
      dniError.style.display = "none"
    }

    // Validar consentimiento
    const consentimentChecked = document.querySelector('input[name="consentiment"]:checked') as HTMLInputElement
    const consentimentError = document.getElementById("consentimentError") as HTMLDivElement

    if (!consentimentChecked) {
      consentimentError.style.display = "block"
      isValid = false
    } else {
      consentimentError.style.display = "none"
    }

    // Validar firma
    const signatureError = document.getElementById("signatureError") as HTMLDivElement

    if (signaturePadRef.current && signaturePadRef.current.isEmpty()) {
      signatureError.style.display = "block"
      isValid = false
    } else {
      signatureError.style.display = "none"
    }

    if (isValid) {
      setIsSubmitting(true)

      try {
        // Obtener datos del formulario
        const dataEnviamentInput = document.getElementById("dataEnviament") as HTMLInputElement
        const signatureBase64 = signaturePadRef.current.toDataURL()

        // Obtener URL de la firma (o usar base64 como fallback)
        let signatureUrl = signatureBase64
        try {
          signatureUrl = await uploadSignature(signatureBase64, dni)
        } catch (uploadError) {
          console.error("Error al subir firma, usando base64:", uploadError)
          // Seguimos con el base64 como fallback
        }

        // Preparar datos para guardar
        const formData = {
          nom: nom,
          dni: dni,
          dataenviament: dataEnviamentInput.value,
          consentiment: consentimentChecked.value,
          signatura: signatureUrl,
          signatura_preview: signatureBase64.substring(0, 100) + "...", // Versión truncada para previsualización
        }

        // Guardar en Supabase
        const { error } = await supabase.from("formulari_respostes").insert([formData])

        if (error) {
          console.error("Error al insertar datos en Supabase:", error)
          throw new Error(`Error al guardar los datos: ${error.message}`)
        }

        alert("Formulari enviat correctament!")

        // Resetear formulario
        const form = document.getElementById("consentForm") as HTMLFormElement
        form.reset()
        setFormattedDate()
        clearSignature()
      } catch (error) {
        console.error("Error al procesar el formulario:", error)
        alert(`Hi ha hagut un problema en desar les dades. Si us plau, torna-ho a provar.`)
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  // Manejar input de DNI (8 números + letra obligatoria)
  const handleDniInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const numericPart = value.slice(0, 8).replace(/[^0-9]/g, "")
    const letterPart = value.length > 8 ? value.slice(8, 9).replace(/[^a-zA-Z]/g, "") : ""
    e.target.value = numericPart + letterPart
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
    csvContent += "Nom,DNI,Data,Consentiment,Signatura URL\n"

    // Añadir filas de datos
    submissions.forEach((item) => {
      csvContent += `${item.nom},${item.dni},${item.dataenviament},${item.consentiment},${item.signatura}\n`
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
        // Primero obtener todas las firmas para eliminarlas del storage
        const { data, error: fetchError } = await supabase.from("formulari_respostes").select("signatura")

        if (fetchError) {
          throw new Error(fetchError.message)
        }

        // Eliminar archivos de Storage
        if (data && data.length > 0) {
          // Extraer los nombres de archivo de las URLs
          const fileNames = data
            .map((item) => {
              const url = item.signatura
              if (!url || url.startsWith("data:")) return null // Ignorar base64
              const parts = url.split("/")
              return parts[parts.length - 1]
            })
            .filter(Boolean)

          if (fileNames.length > 0) {
            const { error: storageError } = await supabase.storage.from("signatures").remove(fileNames)

            if (storageError) {
              console.error("Error al eliminar archivos:", storageError)
            }
          }
        }

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
            <input type="text" id="nom" name="nom" required />
            <div className="error" id="nomError">
              Aquest camp és obligatori
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="dni">DNI (8 números + lletra):</label>
            <input type="text" id="dni" name="dni" maxLength={9} required onChange={handleDniInput} />
            <div className="error" id="dniError">
              Si us plau, introdueix 8 números i una lletra
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="dataEnviament">Data enviament:</label>
            <input type="text" id="dataEnviament" name="dataEnviament" readOnly />
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
                <input type="radio" id="consentimentSi" name="consentiment" value="Si" required />
                <label htmlFor="consentimentSi">Si, dono la meva conformitat a fer-me el RM</label>
              </div>
              <div>
                <input type="radio" id="consentimentNo" name="consentiment" value="No" />
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
          </div>
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
