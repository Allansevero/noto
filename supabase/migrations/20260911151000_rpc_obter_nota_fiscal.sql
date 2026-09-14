-- Função RPC com SECURITY DEFINER para obter com segurança os dados da nota fiscal no backend
CREATE OR REPLACE FUNCTION public.fn_obter_nota_fiscal(p_nota_id text)
RETURNS jsonb AS $$
DECLARE
  v_row public.notas_fiscais%ROWTYPE;
  v_uuid uuid;
BEGIN
  -- Valida se o ID informado é um UUID válido
  BEGIN
    v_uuid := p_nota_id::uuid;
  EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
  END;

  SELECT * INTO v_row FROM public.notas_fiscais WHERE id = v_uuid;
  IF v_row.id IS NULL THEN
    RETURN NULL;
  END IF;

  RETURN to_jsonb(v_row);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.fn_obter_nota_fiscal(text) TO authenticated, anon, service_role;

-- Atualiza a função fn_cancelar_nota_fiscal para aceitar text com conversão segura para UUID
CREATE OR REPLACE FUNCTION public.fn_cancelar_nota_fiscal(
  p_nota_id text,
  p_justificativa text DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_row public.notas_fiscais%ROWTYPE;
  v_uuid uuid;
BEGIN
  BEGIN
    v_uuid := p_nota_id::uuid;
  EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', 'ID de nota fiscal inválido.');
  END;

  UPDATE public.notas_fiscais
  SET 
    status = 'cancelada',
    cancelada_em = now(),
    justificativa_cancelamento = COALESCE(p_justificativa, justificativa_cancelamento, 'Cancelamento solicitado pelo prestador do serviço médico')
  WHERE id = v_uuid
  RETURNING * INTO v_row;

  IF v_row.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Nota fiscal não encontrada no banco de dados.');
  END IF;

  RETURN jsonb_build_object('success', true, 'nota', to_jsonb(v_row));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.fn_cancelar_nota_fiscal(text, text) TO authenticated, anon, service_role;
