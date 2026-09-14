-- Funções RPC com SECURITY DEFINER para acesso seguro dos dados fiscais no backend
CREATE OR REPLACE FUNCTION public.fn_buscar_dados_fiscais(p_medico_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT to_jsonb(df.*) || jsonb_build_object('cnpj', COALESCE(m.cnpj, ''))
  INTO v_result
  FROM public.medico_dados_fiscais df
  LEFT JOIN public.medicos m ON m.id = df.medico_id
  WHERE df.medico_id = p_medico_id;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.fn_buscar_dados_fiscais(uuid) TO authenticated, anon, service_role;

CREATE OR REPLACE FUNCTION public.fn_atualizar_focus_empresa(
  p_medico_id uuid,
  p_focus_empresa_id text,
  p_focus_empresa_status text
)
RETURNS jsonb AS $$
BEGIN
  UPDATE public.medico_dados_fiscais
  SET focus_empresa_id = p_focus_empresa_id,
      focus_empresa_status = p_focus_empresa_status,
      certificado_validado_em = now(),
      atualizado_em = now()
  WHERE medico_id = p_medico_id;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.fn_atualizar_focus_empresa(uuid, text, text) TO authenticated, anon, service_role;
