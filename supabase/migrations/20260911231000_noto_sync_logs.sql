-- Criação da tabela de auditoria e histórico de execuções do Noto Sync (Webhook e Varredura)
CREATE TABLE IF NOT EXISTS public.noto_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medico_id UUID REFERENCES public.medicos(id) ON DELETE CASCADE,
  origem TEXT NOT NULL, -- 'webhook', 'cron', 'manual'
  status TEXT NOT NULL, -- 'sucesso', 'sem_movimentacao', 'aviso', 'erro'
  transacoes_analisadas INT DEFAULT 0,
  notas_emitidas INT DEFAULT 0,
  mensagem TEXT,
  detalhes JSONB DEFAULT '{}'::jsonb,
  criado_em TIMESTAMPTZ DEFAULT now()
);

-- Índices para buscas rápidas
CREATE INDEX IF NOT EXISTS idx_noto_sync_logs_medico ON public.noto_sync_logs(medico_id);
CREATE INDEX IF NOT EXISTS idx_noto_sync_logs_criado_em ON public.noto_sync_logs(criado_em DESC);

-- Permissões
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.noto_sync_logs TO authenticated, service_role;
GRANT SELECT ON TABLE public.noto_sync_logs TO anon;

-- RLS
ALTER TABLE public.noto_sync_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "noto_sync_logs_select_owner" ON public.noto_sync_logs;
CREATE POLICY "noto_sync_logs_select_owner" ON public.noto_sync_logs
  FOR SELECT
  TO authenticated
  USING (
    medico_id IN (
      SELECT m.id FROM public.medicos m WHERE m.owner_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "noto_sync_logs_insert_service" ON public.noto_sync_logs;
CREATE POLICY "noto_sync_logs_insert_service" ON public.noto_sync_logs
  FOR ALL
  TO authenticated, service_role
  USING (true)
  WITH CHECK (true);
