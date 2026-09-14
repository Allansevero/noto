-- Atualiza fn_buscar_dados_fiscais para incluir cnpj da tabela medicos
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
