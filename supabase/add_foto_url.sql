-- =============================================================================
-- add_foto_url.sql
-- Agrega la columna foto_url a personas y configura Storage para fotos de líderes
--
-- PASO 1: Ejecutar este script en Supabase SQL Editor
-- PASO 2: Crear el bucket en Supabase Dashboard → Storage → New bucket
--         Nombre: leader-photos
--         Public: ✅ ON
-- =============================================================================

-- 1. Agregar columna foto_url a personas
ALTER TABLE public.personas
  ADD COLUMN IF NOT EXISTS foto_url text;

COMMENT ON COLUMN public.personas.foto_url IS
  'URL pública de la foto del líder en Supabase Storage (bucket: leader-photos)';

-- 2. Políticas de Storage para el bucket leader-photos
--    (ejecutar DESPUÉS de crear el bucket en el Dashboard)

-- Cualquiera puede subir fotos (formulario público de líderes)
DROP POLICY IF EXISTS "public_upload_leader_photos" ON storage.objects;
CREATE POLICY "public_upload_leader_photos"
  ON storage.objects FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'leader-photos');

-- Cualquiera puede leer fotos (las URLs son públicas)
DROP POLICY IF EXISTS "public_read_leader_photos" ON storage.objects;
CREATE POLICY "public_read_leader_photos"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'leader-photos');

-- Usuarios autenticados pueden actualizar sus fotos (portal de líderes)
DROP POLICY IF EXISTS "auth_update_leader_photos" ON storage.objects;
CREATE POLICY "auth_update_leader_photos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'leader-photos')
  WITH CHECK (bucket_id = 'leader-photos');

-- Verificación
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'personas' AND column_name = 'foto_url';
