-- Crear función para crear la tabla si no existe
CREATE OR REPLACE FUNCTION create_formulari_table()
RETURNS void AS $$
BEGIN
  -- Crear la tabla si no existe
  CREATE TABLE IF NOT EXISTS formulari_respostes (
    id BIGSERIAL PRIMARY KEY,
    nom TEXT NOT NULL,
    dni TEXT NOT NULL,
    dataEnviament TEXT NOT NULL,
    consentiment TEXT NOT NULL,
    signatura TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  
  -- Configurar políticas de seguridad RLS (Row Level Security)
  -- Habilitar RLS
  ALTER TABLE formulari_respostes ENABLE ROW LEVEL SECURITY;
  
  -- Crear política para permitir inserciones anónimas
  CREATE POLICY insert_policy ON formulari_respostes
    FOR INSERT TO anon
    WITH CHECK (true);
  
  -- Crear política para permitir lectura anónima (solo para el panel de admin)
  CREATE POLICY select_policy ON formulari_respostes
    FOR SELECT TO anon
    USING (true);
END;
$$ LANGUAGE plpgsql;
