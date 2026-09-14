-- 1. Cria ou atualiza o bucket de storage para imagens de perfil (perfis)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'perfis',
  'perfis',
  true,
  5242880, -- 5MB
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];

-- 2. Políticas de segurança do bucket perfis
DROP POLICY IF EXISTS "perfis_select_public" ON storage.objects;
CREATE POLICY "perfis_select_public"
ON storage.objects FOR SELECT
USING (bucket_id = 'perfis');

DROP POLICY IF EXISTS "perfis_insert_policy" ON storage.objects;
CREATE POLICY "perfis_insert_policy"
ON storage.objects FOR INSERT
TO authenticated, service_role, anon
WITH CHECK (bucket_id = 'perfis');

DROP POLICY IF EXISTS "perfis_update_policy" ON storage.objects;
CREATE POLICY "perfis_update_policy"
ON storage.objects FOR UPDATE
TO authenticated, service_role, anon
USING (bucket_id = 'perfis');

DROP POLICY IF EXISTS "perfis_delete_policy" ON storage.objects;
CREATE POLICY "perfis_delete_policy"
ON storage.objects FOR DELETE
TO authenticated, service_role, anon
USING (bucket_id = 'perfis');

-- 3. Adiciona colunas avatar_url, telefone e username na tabela medicos
ALTER TABLE public.medicos 
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS telefone text,
  ADD COLUMN IF NOT EXISTS username text;
