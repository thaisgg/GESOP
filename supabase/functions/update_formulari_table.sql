CREATE OR REPLACE FUNCTION update_formulari_table()
RETURNS void AS $$
BEGIN
  -- Añadir campo para la URL de la firma si no existe
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'formulari_respostes' AND column_name = 'signatura_url'
  ) THEN
    ALTER TABLE formulari_respostes ADD COLUMN signatura_url TEXT;
  END IF;
  
  -- Añadir campo para una versión truncada de la firma si no existe
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'formulari_respostes' AND column_name = 'signatura_preview'
  ) THEN
    ALTER TABLE formulari_respostes ADD COLUMN signatura_preview TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql;
