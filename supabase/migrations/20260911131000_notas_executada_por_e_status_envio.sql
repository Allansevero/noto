-- Adiciona executada_por e status_envio em notas_fiscais
ALTER TABLE public.notas_fiscais
  ADD COLUMN IF NOT EXISTS executada_por text DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS status_envio text DEFAULT 'nao_enviado',
  ADD COLUMN IF NOT EXISTS enviado_em timestamptz DEFAULT NULL;

-- Atualiza registros existentes com base em pluggy_transacao_id
UPDATE public.notas_fiscais
SET executada_por = CASE
  WHEN pluggy_transacao_id IS NOT NULL THEN 'open_finance'
  ELSE 'manual'
END
WHERE executada_por IS NULL OR executada_por = 'manual';

-- Atualiza a função fn_registrar_nota_fiscal
CREATE OR REPLACE FUNCTION public.fn_registrar_nota_fiscal(
  p_medico_id uuid,
  p_paciente_id uuid,
  p_numero_nota integer,
  p_valor_servico numeric,
  p_xml_url text,
  p_pluggy_transacao_id text DEFAULT NULL,
  p_data_pagamento timestamptz DEFAULT NULL,
  p_ambiente text DEFAULT 'homologacao',
  p_clinica_id uuid DEFAULT NULL,
  p_executada_por text DEFAULT 'manual',
  p_status_envio text DEFAULT 'nao_enviado'
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
    pluggy_transacao_id,
    data_pagamento,
    ambiente,
    executada_por,
    status_envio,
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
    p_pluggy_transacao_id,
    p_data_pagamento,
    COALESCE(p_ambiente, 'homologacao'),
    v_executada_por,
    COALESCE(p_status_envio, 'nao_enviado'),
    now()
  )
  RETURNING id INTO v_id;

  RETURN jsonb_build_object(
    'success', true,
    'id', v_id,
    'pluggy_transacao_id', p_pluggy_transacao_id,
    'executada_por', v_executada_por,
    'status_envio', COALESCE(p_status_envio, 'nao_enviado')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.fn_registrar_nota_fiscal(uuid, uuid, integer, numeric, text, text, timestamptz, text, uuid, text, text) TO authenticated, anon, service_role;

-- Função para marcar nota como enviada
CREATE OR REPLACE FUNCTION public.fn_marcar_nota_enviada(
  p_nota_id uuid,
  p_medico_id uuid
)
RETURNS jsonb AS $$
BEGIN
  UPDATE public.notas_fiscais
  SET status_envio = 'enviado',
      enviado_em = now()
  WHERE id = p_nota_id
    AND medico_id = p_medico_id;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.fn_marcar_nota_enviada(uuid, uuid) TO authenticated, anon, service_role;
