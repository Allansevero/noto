-- Fix: RLS em medico_dados_fiscais bloqueava INSERT silenciosamente.
--
-- Problema: a policy "dados_fiscais_write_owner" usava FOR ALL com USING
-- mas sem WITH CHECK explícito. No PostgreSQL, para INSERT, a cláusula
-- WITH CHECK não é herdada automaticamente da USING em policies FOR ALL —
-- o INSERT era rejeitado sem erro visível (0 rows afetadas).
--
-- Solução: substituir a policy genérica FOR ALL por três policies
-- separadas (INSERT / UPDATE / DELETE), cada uma com USING + WITH CHECK
-- apropriados para o verbo. O WITH CHECK no INSERT valida se o medico_id
-- pertence ao owner_user_id do usuário autenticado.

-- 1. Remove a policy antiga que cobre INSERT/UPDATE/DELETE em bloco
DROP POLICY IF EXISTS dados_fiscais_write_owner ON public.medico_dados_fiscais;

-- 2. INSERT — valida apenas WITH CHECK (não existe row ainda para USING)
CREATE POLICY dados_fiscais_insert_owner
  ON public.medico_dados_fiscais
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.medicos m
      WHERE m.id = medico_dados_fiscais.medico_id
        AND m.owner_user_id = auth.uid()
    )
  );

-- 3. UPDATE — USING filtra rows visíveis; WITH CHECK garante que o novo
--    valor de medico_id ainda pertença ao mesmo owner
CREATE POLICY dados_fiscais_update_owner
  ON public.medico_dados_fiscais
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.medicos m
      WHERE m.id = medico_dados_fiscais.medico_id
        AND m.owner_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.medicos m
      WHERE m.id = medico_dados_fiscais.medico_id
        AND m.owner_user_id = auth.uid()
    )
  );

-- 4. DELETE — apenas USING (não há WITH CHECK em DELETE)
CREATE POLICY dados_fiscais_delete_owner
  ON public.medico_dados_fiscais
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.medicos m
      WHERE m.id = medico_dados_fiscais.medico_id
        AND m.owner_user_id = auth.uid()
    )
  );
