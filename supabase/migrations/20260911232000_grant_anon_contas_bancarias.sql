-- Concede permissão de leitura para rotinas server-side / webhooks anônimos
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON TABLE public.medico_contas_bancarias TO anon;
GRANT SELECT ON TABLE public.pacientes TO anon;
GRANT ALL ON TABLE public.noto_sync_logs TO anon, authenticated, service_role;

-- Policy RLS para permitir que rotinas de background / webhooks acessem contas ativas
DROP POLICY IF EXISTS "medico_contas_select_anon_webhook" ON public.medico_contas_bancarias;
CREATE POLICY "medico_contas_select_anon_webhook" ON public.medico_contas_bancarias
  FOR SELECT
  TO anon
  USING (ativa_para_recebimento = true);

DROP POLICY IF EXISTS "pacientes_select_anon_webhook" ON public.pacientes;
CREATE POLICY "pacientes_select_anon_webhook" ON public.pacientes
  FOR SELECT
  TO anon
  USING (true);
