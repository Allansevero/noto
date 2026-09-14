-- Migration: Atualização das funções RPC de Notas Fiscais para suporte integral a Focus NFe

-- 1. Cria função RPC para atualizar referência e PDF da nota com SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.fn_atualizar_nota_focus(
  p_nota_id text,
  p_referencia_focus text,
  p_pdf_url text DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_uuid uuid;
  v_row public.notas_fiscais%ROWTYPE;
BEGIN
  BEGIN
    v_uuid := p_nota_id::uuid;
  EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', 'ID de nota fiscal inválido.');
  END;

  UPDATE public.notas_fiscais
  SET 
    referencia_focus = COALESCE(p_referencia_focus, referencia_focus),
    pdf_url = COALESCE(p_pdf_url, pdf_url)
  WHERE id = v_uuid
  RETURNING * INTO v_row;

  IF v_row.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Nota fiscal não encontrada.');
  END IF;

  RETURN jsonb_build_object('success', true, 'nota', to_jsonb(v_row));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.fn_atualizar_nota_focus(text, text, text) TO authenticated, anon, service_role;

-- 2. Atualiza fn_registrar_nota_fiscal para receber referencia_focus e pdf_url diretamente
CREATE OR REPLACE FUNCTION public.fn_registrar_nota_fiscal(
  p_medico_id uuid,
  p_paciente_id uuid,
  p_numero_nota integer,
  p_valor_servico numeric,
  p_xml_url text DEFAULT NULL,
  p_pluggy_transacao_id text DEFAULT NULL,
  p_data_pagamento timestamp with time zone DEFAULT NULL,
  p_ambiente text DEFAULT 'homologacao',
  p_clinica_id uuid DEFAULT NULL,
  p_executada_por text DEFAULT 'manual',
  p_status_envio text DEFAULT 'nao_enviado',
  p_referencia_focus text DEFAULT NULL,
  p_pdf_url text DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_id uuid;
  v_paciente_criado_em timestamptz;
  v_nota_existente_numero integer;
  v_executada_por text;
BEGIN
  v_executada_por := CASE
    WHEN p_pluggy_transacao_id IS NOT NULL THEN 'open_finance'
    ELSE COALESCE(p_executada_por, 'manual')
  END;

  IF p_pluggy_transacao_id IS NOT NULL THEN
    SELECT numero_nota INTO v_nota_existente_numero
    FROM public.notas_fiscais
    WHERE medico_id = p_medico_id
      AND pluggy_transacao_id = p_pluggy_transacao_id
    LIMIT 1;

    IF v_nota_existente_numero IS NOT NULL THEN
      RAISE EXCEPTION 'Pagamento já faturado anteriormente (NFS-e nº %). Emissão duplicada rejeitada.', v_nota_existente_numero
        USING ERRCODE = '23505';
    END IF;
  END IF;

  IF p_ambiente = 'producao' AND p_data_pagamento IS NOT NULL THEN
    SELECT criado_em INTO v_paciente_criado_em
    FROM public.pacientes
    WHERE id = p_paciente_id;

    IF v_paciente_criado_em IS NOT NULL AND p_data_pagamento < v_paciente_criado_em THEN
      RAISE EXCEPTION 'Pagamento recebido em % é anterior ao cadastro do paciente em %. Emissão bloqueada em produção por compliance fiscal.',
        p_data_pagamento, v_paciente_criado_em
        USING ERRCODE = 'P0001';
    END IF;
  END IF;

  INSERT INTO public.notas_fiscais (
    medico_id,
    paciente_id,
    clinica_id,
    numero_nota,
    valor_servico,
    data_emissao,
    xml_url,
    pdf_url,
    referencia_focus,
    pluggy_transacao_id,
    data_pagamento,
    ambiente,
    executada_por,
    status_envio,
    status,
    criado_em
  )
  VALUES (
    p_medico_id,
    p_paciente_id,
    p_clinica_id,
    p_numero_nota,
    p_valor_servico,
    CURRENT_DATE,
    p_xml_url,
    p_pdf_url,
    p_referencia_focus,
    p_pluggy_transacao_id,
    p_data_pagamento,
    COALESCE(p_ambiente, 'homologacao'),
    v_executada_por,
    COALESCE(p_status_envio, 'nao_enviado'),
    'autorizada',
    now()
  )
  RETURNING id INTO v_id;

  RETURN jsonb_build_object(
    'success', true,
    'id', v_id,
    'pluggy_transacao_id', p_pluggy_transacao_id,
    'executada_por', v_executada_por,
    'status_envio', COALESCE(p_status_envio, 'nao_enviado'),
    'referencia_focus', p_referencia_focus
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.fn_registrar_nota_fiscal(
  uuid, uuid, integer, numeric, text, text, timestamp with time zone, text, uuid, text, text, text, text
) TO authenticated, anon, service_role;
