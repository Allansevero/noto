-- Criação da tabela de contas bancárias conectadas do médico (Open Finance via Pluggy)
CREATE TABLE IF NOT EXISTS public.medico_contas_bancarias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medico_id UUID NOT NULL REFERENCES public.medicos(id) ON DELETE CASCADE,
  pluggy_item_id TEXT NOT NULL,
  pluggy_account_id TEXT NOT NULL UNIQUE,
  banco_codigo TEXT,
  banco_nome TEXT NOT NULL,
  agencia TEXT,
  numero_conta TEXT NOT NULL,
  tipo_conta TEXT,
  saldo NUMERIC(12, 2) DEFAULT 0.00,
  moeda TEXT DEFAULT 'BRL',
  ativa_para_recebimento BOOLEAN DEFAULT true,
  status_conexao TEXT DEFAULT 'ativo',
  criado_em TIMESTAMPTZ DEFAULT now(),
  atualizado_em TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_medico_contas_medico_id ON public.medico_contas_bancarias(medico_id);
CREATE INDEX IF NOT EXISTS idx_medico_contas_pluggy_item ON public.medico_contas_bancarias(pluggy_item_id);

-- Permissões DDL
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.medico_contas_bancarias TO authenticated, service_role;

-- RLS (Row Level Security)
ALTER TABLE public.medico_contas_bancarias ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "medico_contas_select_owner" ON public.medico_contas_bancarias;
CREATE POLICY "medico_contas_select_owner" ON public.medico_contas_bancarias
  FOR SELECT
  TO authenticated
  USING (
    medico_id IN (
      SELECT m.id FROM public.medicos m WHERE m.owner_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "medico_contas_write_owner" ON public.medico_contas_bancarias;
CREATE POLICY "medico_contas_write_owner" ON public.medico_contas_bancarias
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

-- Função RPC com SECURITY DEFINER para upsert de contas bancárias da Pluggy
CREATE OR REPLACE FUNCTION public.fn_salvar_conta_bancaria_pluggy(
  p_medico_id UUID,
  p_pluggy_item_id TEXT,
  p_pluggy_account_id TEXT,
  p_banco_codigo TEXT,
  p_banco_nome TEXT,
  p_agencia TEXT,
  p_numero_conta TEXT,
  p_tipo_conta TEXT,
  p_saldo NUMERIC,
  p_moeda TEXT
)
RETURNS jsonb AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.medico_contas_bancarias (
    medico_id,
    pluggy_item_id,
    pluggy_account_id,
    banco_codigo,
    banco_nome,
    agencia,
    numero_conta,
    tipo_conta,
    saldo,
    moeda,
    ativa_para_recebimento,
    status_conexao,
    atualizado_em
  )
  VALUES (
    p_medico_id,
    p_pluggy_item_id,
    p_pluggy_account_id,
    p_banco_codigo,
    p_banco_nome,
    p_agencia,
    p_numero_conta,
    p_tipo_conta,
    COALESCE(p_saldo, 0.00),
    COALESCE(p_moeda, 'BRL'),
    true,
    'ativo',
    now()
  )
  ON CONFLICT (pluggy_account_id) DO UPDATE SET
    saldo = EXCLUDED.saldo,
    status_conexao = 'ativo',
    atualizado_em = now()
  RETURNING id INTO v_id;

  RETURN jsonb_build_object('success', true, 'id', v_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.fn_salvar_conta_bancaria_pluggy(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC, TEXT) TO authenticated, anon, service_role;
