-- Tabela de controle de polling de pagamento do onboarding.
--
-- Cada médico tem no máximo uma linha ativa (status='waiting').
-- A Edge Function "poll-payment" atualiza essa linha ao encontrar o PIX.
-- O cliente assiste via Supabase Realtime e reage imediatamente.
--
-- Isso substitui o polling bloqueante de 12 iterações × 3.5s que
-- existia diretamente no handleStartSimulation() da página de onboarding.

CREATE TABLE IF NOT EXISTS public.onboarding_payment_polls (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  medico_id           uuid        NOT NULL REFERENCES public.medicos(id) ON DELETE CASCADE,
  pluggy_account_id   text        NOT NULL,
  status              text        NOT NULL DEFAULT 'waiting'
                      CHECK (status IN ('waiting', 'found', 'error')),
  transacao_id        text        NULL,
  transacao_data      text        NULL,
  transacao_valor     numeric     NULL,
  transacao_descricao text        NULL,
  tentativas          integer     NOT NULL DEFAULT 0,
  ultimo_check_em     timestamptz NULL,
  criado_em           timestamptz NOT NULL DEFAULT now(),
  atualizado_em       timestamptz NOT NULL DEFAULT now()
);

-- Garante que cada médico tenha no máximo uma linha ativa por vez
CREATE UNIQUE INDEX IF NOT EXISTS onboarding_payment_polls_medico_waiting_idx
  ON public.onboarding_payment_polls (medico_id)
  WHERE status = 'waiting';

-- Índice auxiliar para queries por status
CREATE INDEX IF NOT EXISTS onboarding_payment_polls_status_idx
  ON public.onboarding_payment_polls (medico_id, status);

-- Habilita RLS
ALTER TABLE public.onboarding_payment_polls ENABLE ROW LEVEL SECURITY;

-- SELECT: médico vê apenas suas próprias linhas
CREATE POLICY onboarding_polls_select
  ON public.onboarding_payment_polls
  FOR SELECT
  USING (
    medico_id IN (SELECT fn_medicos_do_usuario())
  );

-- INSERT: médico insere apenas para si
CREATE POLICY onboarding_polls_insert
  ON public.onboarding_payment_polls
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.medicos m
      WHERE m.id = onboarding_payment_polls.medico_id
        AND m.owner_user_id = auth.uid()
    )
  );

-- UPDATE: médico atualiza apenas suas linhas (e a Edge Function usa service_role, sem RLS)
CREATE POLICY onboarding_polls_update
  ON public.onboarding_payment_polls
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.medicos m
      WHERE m.id = onboarding_payment_polls.medico_id
        AND m.owner_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.medicos m
      WHERE m.id = onboarding_payment_polls.medico_id
        AND m.owner_user_id = auth.uid()
    )
  );

-- DELETE: médico pode limpar suas linhas
CREATE POLICY onboarding_polls_delete
  ON public.onboarding_payment_polls
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.medicos m
      WHERE m.id = onboarding_payment_polls.medico_id
        AND m.owner_user_id = auth.uid()
    )
  );

-- Permissões de acesso
GRANT ALL ON TABLE public.onboarding_payment_polls TO authenticated, service_role;

-- Habilita Realtime para que o cliente receba push de mudança de status
ALTER PUBLICATION supabase_realtime ADD TABLE public.onboarding_payment_polls;
