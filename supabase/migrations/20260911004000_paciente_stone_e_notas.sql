-- Concede permissões para as tabelas de pacientes e notas_fiscais
GRANT ALL ON TABLE public.pacientes TO authenticated, service_role;
GRANT ALL ON TABLE public.notas_fiscais TO authenticated, service_role;

-- Habilita RLS se ainda não estiver habilitado
ALTER TABLE public.pacientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notas_fiscais ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pacientes_owner_policy" ON public.pacientes;
CREATE POLICY "pacientes_owner_policy" ON public.pacientes
  FOR ALL
  TO authenticated
  USING (
    medico_id IN (
      SELECT m.id FROM public.medicos m WHERE m.owner_user_id = auth.uid()
    )
  )
  WITH CHECK (
    medico_id IN (
      SELECT m.id FROM public.medicos m WHERE m.owner_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "notas_fiscais_owner_policy" ON public.notas_fiscais;
CREATE POLICY "notas_fiscais_owner_policy" ON public.notas_fiscais
  FOR ALL
  TO authenticated
  USING (
    medico_id IN (
      SELECT m.id FROM public.medicos m WHERE m.owner_user_id = auth.uid()
    )
  )
  WITH CHECK (
    medico_id IN (
      SELECT m.id FROM public.medicos m WHERE m.owner_user_id = auth.uid()
    )
  );

-- Função RPC com SECURITY DEFINER para criar ou obter automaticamente o paciente da Stone
CREATE OR REPLACE FUNCTION public.fn_obter_ou_criar_paciente_teste(
  p_medico_id uuid,
  p_nome text DEFAULT '33 841 732 Allan Miranda Severo Rodrigues',
  p_cpf text DEFAULT '33841732000163',
  p_email text DEFAULT 'severoallan2019@gmail.com'
)
RETURNS jsonb AS $$
DECLARE
  v_paciente_id uuid;
  v_paciente jsonb;
BEGIN
  -- Verifica se o paciente teste já existe para esse médico
  SELECT id INTO v_paciente_id
  FROM public.pacientes
  WHERE medico_id = p_medico_id
    AND (cpf = p_cpf OR email = p_email)
  LIMIT 1;

  IF v_paciente_id IS NULL THEN
    INSERT INTO public.pacientes (medico_id, nome, cpf, email, criado_em)
    VALUES (p_medico_id, p_nome, p_cpf, p_email, now())
    RETURNING id INTO v_paciente_id;
  END IF;

  SELECT to_jsonb(p.*) INTO v_paciente
  FROM public.pacientes p
  WHERE p.id = v_paciente_id;

  RETURN jsonb_build_object('success', true, 'paciente', v_paciente);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.fn_obter_ou_criar_paciente_teste(uuid, text, text, text) TO authenticated, anon, service_role;

-- Função RPC com SECURITY DEFINER para registrar a nota fiscal emitida
CREATE OR REPLACE FUNCTION public.fn_registrar_nota_fiscal(
  p_medico_id uuid,
  p_paciente_id uuid,
  p_numero_nota integer,
  p_valor_servico numeric,
  p_xml_url text
)
RETURNS jsonb AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO public.notas_fiscais (
    medico_id,
    paciente_id,
    numero_nota,
    valor_servico,
    data_emissao,
    xml_url,
    criado_em
  )
  VALUES (
    p_medico_id,
    p_paciente_id,
    p_numero_nota,
    p_valor_servico,
    CURRENT_DATE,
    p_xml_url,
    now()
  )
  RETURNING id INTO v_id;

  RETURN jsonb_build_object('success', true, 'id', v_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.fn_registrar_nota_fiscal(uuid, uuid, integer, numeric, text) TO authenticated, anon, service_role;
