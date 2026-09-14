-- Adiciona colunas de controle anti-duplicação e data de pagamento em notas_fiscais
ALTER TABLE public.notas_fiscais
  ADD COLUMN IF NOT EXISTS pluggy_transacao_id text,
  ADD COLUMN IF NOT EXISTS data_pagamento timestamp with time zone,
  ADD COLUMN IF NOT EXISTS ambiente text DEFAULT 'homologacao';

-- Cria índice UNIQUE condicional para garantir idempotência estrita por médico e transação bancária
CREATE UNIQUE INDEX IF NOT EXISTS idx_notas_fiscais_medico_transacao 
  ON public.notas_fiscais (medico_id, pluggy_transacao_id) 
  WHERE pluggy_transacao_id IS NOT NULL;

-- Atualiza a função RPC para incluir os novos campos e validações de integridade
CREATE OR REPLACE FUNCTION public.fn_registrar_nota_fiscal(
  p_medico_id uuid,
  p_paciente_id uuid,
  p_numero_nota integer,
  p_valor_servico numeric,
  p_xml_url text,
  p_pluggy_transacao_id text DEFAULT NULL,
  p_data_pagamento timestamptz DEFAULT NULL,
  p_ambiente text DEFAULT 'homologacao'
)
RETURNS jsonb AS $$
DECLARE
  v_id uuid;
  v_paciente_criado_em timestamptz;
  v_nota_existente_numero integer;
BEGIN
  -- 1. Regra de Anti-duplicação: Se a transação bancária já foi faturada, impede duplicação
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

  -- 2. Regra de Produção: Pagamento nunca pode ser anterior ao registro do paciente
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

  -- 3. Insere a nota fiscal vinculada ao pagamento
  INSERT INTO public.notas_fiscais (
    medico_id,
    paciente_id,
    numero_nota,
    valor_servico,
    data_emissao,
    xml_url,
    pluggy_transacao_id,
    data_pagamento,
    ambiente,
    criado_em
  )
  VALUES (
    p_medico_id,
    p_paciente_id,
    p_numero_nota,
    p_valor_servico,
    CURRENT_DATE,
    p_xml_url,
    p_pluggy_transacao_id,
    p_data_pagamento,
    COALESCE(p_ambiente, 'homologacao'),
    now()
  )
  RETURNING id INTO v_id;

  RETURN jsonb_build_object(
    'success', true,
    'id', v_id,
    'pluggy_transacao_id', p_pluggy_transacao_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.fn_registrar_nota_fiscal(uuid, uuid, integer, numeric, text, text, timestamptz, text) TO authenticated, anon, service_role;
