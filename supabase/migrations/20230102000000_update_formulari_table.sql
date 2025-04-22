-- Añadir campo para la URL de la firma
ALTER TABLE formulari_respostes 
ADD COLUMN IF NOT EXISTS signatura_url TEXT;

-- Añadir campo para una versión truncada de la firma (para previsualización)
ALTER TABLE formulari_respostes 
ADD COLUMN IF NOT EXISTS signatura_preview TEXT;

-- Crear un bucket para almacenar las firmas si no existe
-- Nota: Esto debe hacerse manualmente en la interfaz de Supabase
-- ya que SQL no puede crear buckets de Storage
