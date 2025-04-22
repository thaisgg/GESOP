-- Asegurar que las políticas RLS están correctamente configuradas
ALTER TABLE formulari_respostes ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes para evitar conflictos
DROP POLICY IF EXISTS insert_policy ON formulari_respostes;
DROP POLICY IF EXISTS select_policy ON formulari_respostes;

-- Crear política para permitir inserciones anónimas
CREATE POLICY insert_policy ON formulari_respostes
  FOR INSERT TO anon
  WITH CHECK (true);

-- Crear política para permitir lectura anónima
CREATE POLICY select_policy ON formulari_respostes
  FOR SELECT TO anon
  USING (true);

-- Crear política para permitir actualización anónima
CREATE POLICY update_policy ON formulari_respostes
  FOR UPDATE TO anon
  USING (true);

-- Crear política para permitir eliminación anónima
CREATE POLICY delete_policy ON formulari_respostes
  FOR DELETE TO anon
  USING (true);
