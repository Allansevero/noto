-- Migration: Remove sobrecargas conflitantes de fn_registrar_nota_fiscal que causavam PGRST203 (HTTP 300 Multiple Choices)

DROP FUNCTION IF EXISTS public.fn_registrar_nota_fiscal(uuid, uuid, integer, numeric, text);
DROP FUNCTION IF EXISTS public.fn_registrar_nota_fiscal(uuid, uuid, integer, numeric, text, text, timestamp with time zone, text);
DROP FUNCTION IF EXISTS public.fn_registrar_nota_fiscal(uuid, uuid, integer, numeric, text, text, timestamp with time zone, text, uuid, text, text);
DROP FUNCTION IF EXISTS public.fn_registrar_nota_fiscal(uuid, uuid, integer, numeric, text, text, timestamp with time zone, text, uuid, text, text, text, text);

CREATE OR REPLACE FUNCTION public.fn_registrar_nota_fiscal(
  p_medico_id uuid,
  p_paciente_id uuid,
  p_numero_nota integer DEFAULT NULL,
  p_valor_servico numeric DEFAULT 0.01,
  p_xml_url text DEFAULT NULL,
  p_pluggy_transacao_id text DEFAULT NULL,
  p_data_pagamento timestamp with time zone DEFAULT NULL,
  p_ambiente text DEFAULT 'homologacao',
  p_clinica_id uuid DEFAULT NULL,
  p_executada_por text DEFAULT 'manual',
  p_status_envio text DEFAULT 'nao_enviado',
  p_referencia_focus text DEFAULT NULL,
  p_pdf_url text DEFAULT NULL,
  p_status text DEFAULT 'autorizada'
)
RETURNS jsonb AS $$
DECLARE
  v_id uuid;
  v_paciente_criado_em timestamptz;
  v_nota_existente_numero integer;
  v_executada_por text;
  v_numero_final integer;
BEGIN
  v_executada_por := CASE
    WHEN p_pluggy_transacao_id IS NOT NULL THEN 'open_finance'
    ELSE COALESCE(p_executada_por, 'manual')
  END;

  -- 1. Anti-duplicação se houver transação Pluggy
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

  -- 2. Regra de Produção: Pagamento não pode ser anterior ao registro do paciente
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

  -- 3. Garante número sequencial único para o médico se o fornecido for nulo, <= 0 ou duplicado
  IF p_numero_nota IS NULL OR p_numero_nota <= 0 OR EXISTS (
    SELECT 1 FROM public.notas_fiscais WHERE medico_id = p_medico_id AND numero_nota = p_numero_nota
  ) THEN
    SELECT COALESCE(MAX(numero_nota), 0) + 1 INTO v_numero_final
    FROM public.notas_fiscais
    WHERE medico_id = p_medico_id;
  ELSE
    v_numero_final := p_numero_nota;
  END IF;

  -- 4. Insere a nota fiscal
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
    v_numero_final,
    COALESCE(p_valor_servico, 0.01),
    CURRENT_DATE,
    p_xml_url,
    p_pdf_url,
    p_referencia_focus,
    p_pluggy_transacao_id,
    p_data_pagamento,
    COALESCE(p_ambiente, 'homologacao'),
    v_executada_por,
    COALESCE(p_status_envio, 'nao_enviado'),
    COALESCE(p_status, 'autorizada'),
    now()
  )
  RETURNING id INTO v_id;

  RETURN jsonb_build_object(
    'success', true,
    'id', v_id,
    'numero_nota', v_numero_final,
    'pluggy_transacao_id', p_pluggy_transacao_id,
    'executada_por', v_executada_por,
    'status_envio', COALESCE(p_status_envio, 'nao_enviado'),
    'referencia_focus', p_referencia_focus,
    'status', COALESCE(p_status, 'autorizada')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.fn_registrar_nota_fiscal(uuid, uuid, integer, numeric, text, text, timestamp with time zone, text, uuid, text, text, text, text, text) TO authenticated, anon, service_role;
