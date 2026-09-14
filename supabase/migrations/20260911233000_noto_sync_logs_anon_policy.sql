-- Permite que rotinas server-side sem sessão de usuário gravem logs de sincronização
DROP POLICY IF EXISTS "noto_sync_logs_insert_anon" ON public.noto_sync_logs;
CREATE POLICY "noto_sync_logs_insert_anon" ON public.noto_sync_logs
  FOR INSERT
  TO anon, authenticated, service_role
  WITH CHECK (true);

DROP POLICY IF EXISTS "noto_sync_logs_select_anon" ON public.noto_sync_logs;
CREATE POLICY "noto_sync_logs_select_anon" ON public.noto_sync_logs
  FOR SELECT
  TO anon, authenticated, service_role
  USING (true);
