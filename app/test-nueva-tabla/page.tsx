"use client"

import { useState, useEffect } from "react"
import { createClient } from "@supabase/supabase-js"

export default function TestNuevaTabla() {
  const [status, setStatus] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [debugInfo, setDebugInfo] = useState<string | null>(null)
  const [connectionInfo, setConnectionInfo] = useState<any>(null)
  const [testId, setTestId] = useState<number | null>(null)
  const [testResults, setTestResults] = useState<{
    connection: boolean
    insert: boolean
    select: boolean
    update: boolean
    delete: boolean
  }>({
    connection: false,
    insert: false,
    select: false,
    update: false,
    delete: false,
  })

  // Verificar conexión al cargar la página
  useEffect(() => {
    checkConnection()
  }, [])

  // Función para verificar la conexión a Supabase
  const checkConnection = async () => {
    setIsLoading(true)
    setDebugInfo("Verificando conexión a Supabase...")

    try {
      // Inicializar cliente de Supabase
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error("Faltan las variables de entorno de Supabase")
      }

      setConnectionInfo({
        url: supabaseUrl,
        anonKey: supabaseAnonKey.substring(0, 5) + "...", // Solo mostrar parte de la clave por seguridad
      })

      const supabase = createClient(supabaseUrl, supabaseAnonKey)

      // Verificar si la tabla existe
      const { data, error } = await supabase.from("formulari_consentiment").select("id").limit(1)

      if (error) {
        if (error.code === "PGRST116") {
          throw new Error("La tabla formulari_consentiment no existe")
        } else {
          throw error
        }
      }

      setTestResults((prev) => ({ ...prev, connection: true }))
      setDebugInfo("Conexión exitosa. La tabla formulari_consentiment existe.")
    } catch (error) {
      setDebugInfo(`Error de conexión: ${(error as Error).message}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Función para ejecutar todas las pruebas
  const runAllTests = async () => {
    setIsLoading(true)
    setStatus("")
    setDebugInfo("Iniciando pruebas completas...")
    setTestResults({
      connection: false,
      insert: false,
      select: false,
      update: false,
      delete: false,
    })

    try {
      // Inicializar cliente de Supabase
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error("Faltan las variables de entorno de Supabase")
      }

      const supabase = createClient(supabaseUrl, supabaseAnonKey)

      // 1. Prueba de conexión
      setDebugInfo("1. Verificando conexión...")
      const { data: connectionData, error: connectionError } = await supabase
        .from("formulari_consentiment")
        .select("id")
        .limit(1)

      if (connectionError) {
        throw new Error(`Error de conexión: ${connectionError.message}`)
      }

      setTestResults((prev) => ({ ...prev, connection: true }))
      setDebugInfo("✅ Conexión exitosa")

      // 2. Prueba de inserción
      setDebugInfo("2. Probando inserción de datos...")
      const testData = {
        nom: `Test ${new Date().toISOString()}`,
        dni: "12345678Z",
        dataenviament: new Date().toLocaleDateString(),
        consentiment: "Si",
        signatura:
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      }

      const { data: insertData, error: insertError } = await supabase
        .from("formulari_consentiment")
        .insert([testData])
        .select()

      if (insertError) {
        throw new Error(`Error de inserción: ${insertError.message}`)
      }

      const insertedId = insertData[0].id
      setTestId(insertedId)
      setTestResults((prev) => ({ ...prev, insert: true }))
      setDebugInfo(`✅ Inserción exitosa. ID: ${insertedId}`)

      // 3. Prueba de selección
      setDebugInfo("3. Probando selección de datos...")
      const { data: selectData, error: selectError } = await supabase
        .from("formulari_consentiment")
        .select("*")
        .eq("id", insertedId)
        .single()

      if (selectError) {
        throw new Error(`Error de selección: ${selectError.message}`)
      }

      if (!selectData) {
        throw new Error("No se encontró el registro insertado")
      }

      setTestResults((prev) => ({ ...prev, select: true }))
      setDebugInfo(`✅ Selección exitosa. Datos: ${JSON.stringify(selectData.nom)}`)

      // 4. Prueba de actualización
      setDebugInfo("4. Probando actualización de datos...")
      const { error: updateError } = await supabase
        .from("formulari_consentiment")
        .update({ nom: "Test Actualizado" })
        .eq("id", insertedId)

      if (updateError) {
        throw new Error(`Error de actualización: ${updateError.message}`)
      }

      setTestResults((prev) => ({ ...prev, update: true }))
      setDebugInfo("✅ Actualización exitosa")

      // 5. Prueba de eliminación
      setDebugInfo("5. Probando eliminación de datos...")
      const { error: deleteError } = await supabase.from("formulari_consentiment").delete().eq("id", insertedId)

      if (deleteError) {
        throw new Error(`Error de eliminación: ${deleteError.message}`)
      }

      setTestResults((prev) => ({ ...prev, delete: true }))
      setDebugInfo("✅ Eliminación exitosa")

      // Todas las pruebas completadas con éxito
      setStatus("success")
      setDebugInfo("✅ Todas las pruebas completadas con éxito. La tabla funciona correctamente.")
    } catch (error) {
      setStatus("error")
      setDebugInfo(`❌ Error en las pruebas: ${(error as Error).message}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Función para probar solo la inserción
  const testInsert = async () => {
    setIsLoading(true)
    setStatus("")
    setDebugInfo("Probando inserción en la nueva tabla...")

    try {
      // Inicializar cliente de Supabase
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error("Faltan las variables de entorno de Supabase")
      }

      const supabase = createClient(supabaseUrl, supabaseAnonKey)

      // Datos de prueba
      const testData = {
        nom: `Test Inserción ${new Date().toISOString()}`,
        dni: "12345678Z",
        dataenviament: new Date().toLocaleDateString(),
        consentiment: "Si",
        signatura:
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      }

      // Insertar en la nueva tabla
      const { data, error } = await supabase.from("formulari_consentiment").insert([testData]).select()

      if (error) {
        throw new Error(`Error al insertar: ${error.message} (${error.code})`)
      }

      setStatus("success")
      setTestResults((prev) => ({ ...prev, insert: true }))
      setDebugInfo(`Inserción exitosa en la nueva tabla. ID: ${data[0].id}`)
    } catch (error) {
      setStatus("error")
      setDebugInfo(`Error: ${(error as Error).message}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <h1 className="text-2xl font-bold mb-4">Diagnóstico de la nueva tabla</h1>
      <p className="mb-4">
        Esta página realiza pruebas completas en la nueva tabla <code>formulari_consentiment</code> para verificar que
        funciona correctamente.
      </p>

      {connectionInfo && (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-md mb-6">
          <h2 className="font-bold text-lg mb-2">Información de conexión</h2>
          <p>
            <strong>URL de Supabase:</strong> {connectionInfo.url}
          </p>
          <p>
            <strong>Clave anónima:</strong> {connectionInfo.anonKey}
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-4 mb-6">
        <button
          onClick={runAllTests}
          disabled={isLoading}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
        >
          {isLoading ? "Ejecutando pruebas..." : "Ejecutar todas las pruebas"}
        </button>

        <button
          onClick={testInsert}
          disabled={isLoading}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          {isLoading ? "Insertando..." : "Probar solo inserción"}
        </button>

        <button
          onClick={checkConnection}
          disabled={isLoading}
          className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
        >
          {isLoading ? "Verificando..." : "Verificar conexión"}
        </button>
      </div>

      <div className="bg-gray-100 p-4 rounded-md mb-6">
        <h2 className="font-bold text-lg mb-2">Resultados de las pruebas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className={`p-3 rounded-md ${testResults.connection ? "bg-green-100" : "bg-gray-200"}`}>
            <span className="font-bold">Conexión:</span> {testResults.connection ? "✅ Exitosa" : "⏳ No probada"}
          </div>
          <div className={`p-3 rounded-md ${testResults.insert ? "bg-green-100" : "bg-gray-200"}`}>
            <span className="font-bold">Inserción:</span> {testResults.insert ? "✅ Exitosa" : "⏳ No probada"}
          </div>
          <div className={`p-3 rounded-md ${testResults.select ? "bg-green-100" : "bg-gray-200"}`}>
            <span className="font-bold">Selección:</span> {testResults.select ? "✅ Exitosa" : "⏳ No probada"}
          </div>
          <div className={`p-3 rounded-md ${testResults.update ? "bg-green-100" : "bg-gray-200"}`}>
            <span className="font-bold">Actualización:</span> {testResults.update ? "✅ Exitosa" : "⏳ No probada"}
          </div>
          <div className={`p-3 rounded-md ${testResults.delete ? "bg-green-100" : "bg-gray-200"}`}>
            <span className="font-bold">Eliminación:</span> {testResults.delete ? "✅ Exitosa" : "⏳ No probada"}
          </div>
        </div>
      </div>

      {status === "success" && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">¡Éxito!</p>
          <p>La nueva tabla está funcionando correctamente. Puedes usar el formulario con confianza.</p>
        </div>
      )}

      {status === "error" && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">Error</p>
          <p>Hubo un problema al probar la nueva tabla. Revisa la información de diagnóstico para más detalles.</p>
        </div>
      )}

      {debugInfo && (
        <div className="bg-gray-100 border border-gray-300 p-3 rounded mb-4">
          <h3 className="font-bold mb-2">Información de diagnóstico:</h3>
          <pre className="whitespace-pre-wrap text-sm bg-white p-3 rounded border">{debugInfo}</pre>
        </div>
      )}

      <div className="mt-6">
        <h2 className="text-xl font-bold mb-2">Instrucciones</h2>
        <ol className="list-decimal pl-5 space-y-2">
          <li>Haz clic en "Ejecutar todas las pruebas" para verificar completamente la funcionalidad de la tabla.</li>
          <li>Si todas las pruebas son exitosas, la tabla está configurada correctamente.</li>
          <li>Si hay errores, revisa la información de diagnóstico para identificar el problema.</li>
          <li>Una vez que las pruebas sean exitosas, puedes usar el formulario principal con confianza.</li>
        </ol>
      </div>

      <div className="mt-6">
        <a href="/" className="text-blue-500 underline">
          Volver al formulario
        </a>
      </div>
    </div>
  )
}
