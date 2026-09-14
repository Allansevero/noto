-- 1. Cria ou atualiza o bucket de storage para notas fiscais em PDF
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'notas_fiscais',
  'notas_fiscais',
  true,
  10485760, -- 10MB
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['application/pdf'];

-- 2. Políticas de segurança do bucket notas_fiscais
DROP POLICY IF EXISTS "notas_fiscais_select_public" ON storage.objects;
CREATE POLICY "notas_fiscais_select_public"
ON storage.objects FOR SELECT
USING (bucket_id = 'notas_fiscais');

DROP POLICY IF EXISTS "notas_fiscais_insert_policy" ON storage.objects;
CREATE POLICY "notas_fiscais_insert_policy"
ON storage.objects FOR INSERT
TO authenticated, service_role, anon
WITH CHECK (bucket_id = 'notas_fiscais');

DROP POLICY IF EXISTS "notas_fiscais_update_policy" ON storage.objects;
CREATE POLICY "notas_fiscais_update_policy"
ON storage.objects FOR UPDATE
TO authenticated, service_role, anon
USING (bucket_id = 'notas_fiscais');

-- 3. Adiciona colunas na tabela de notas_fiscais para persistência do PDF e controle da Focus NFe
ALTER TABLE public.notas_fiscais 
  ADD COLUMN IF NOT EXISTS pdf_url text,
  ADD COLUMN IF NOT EXISTS referencia_focus text,
  ADD COLUMN IF NOT EXISTS justificativa_cancelamento text;

-- 4. Atualiza a função de cancelamento no banco para armazenar a justificativa
CREATE OR REPLACE FUNCTION public.fn_cancelar_nota_fiscal(
  p_nota_id uuid,
  p_justificativa text DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_row public.notas_fiscais%ROWTYPE;
BEGIN
  UPDATE public.notas_fiscais
  SET 
    status = 'cancelada',
    cancelada_em = now(),
    justificativa_cancelamento = COALESCE(p_justificativa, justificativa_cancelamento, 'Cancelamento solicitado pelo usuário')
  WHERE id = p_nota_id
  RETURNING * INTO v_row;

  IF v_row.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Nota fiscal não encontrada.');
  END IF;

  RETURN jsonb_build_object('success', true, 'nota', to_jsonb(v_row));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.fn_cancelar_nota_fiscal(uuid, text) TO authenticated, anon, service_role;
