-- ==============================================================================
-- Script de Migração: Políticas de RLS para o Bucket "avatares"
-- Execute no SQL Editor do Supabase para liberar uploads e leitura pública de fotos
-- ==============================================================================

-- 1. Cria ou garante que o bucket "avatares" é público
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatares', 'avatares', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Habilita acesso de leitura pública
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Permitir leitura publica em avatares'
    ) THEN
        CREATE POLICY "Permitir leitura publica em avatares"
        ON storage.objects FOR SELECT
        USING (bucket_id = 'avatares');
    END IF;
END $$;

-- 3. Habilita permissão de upload para usuários autenticados e anônimos
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Permitir upload publico em avatares'
    ) THEN
        CREATE POLICY "Permitir upload publico em avatares"
        ON storage.objects FOR INSERT
        WITH CHECK (bucket_id = 'avatares');
    END IF;
END $$;

-- 4. Habilita permissão de atualização
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Permitir update em avatares'
    ) THEN
        CREATE POLICY "Permitir update em avatares"
        ON storage.objects FOR UPDATE
        USING (bucket_id = 'avatares');
    END IF;
END $$;
