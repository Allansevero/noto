-- Migration: Remove sobrecargas conflitantes de fn_cancelar_nota_fiscal que causavam erro PGRST203 (HTTP 300 Multiple Choices)

DROP FUNCTION IF EXISTS public.fn_cancelar_nota_fiscal(uuid, text);
DROP FUNCTION IF EXISTS public.fn_cancelar_nota_fiscal(uuid, uuid);

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
