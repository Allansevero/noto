-- ====================================================================
-- MIGRATION: Corrigir RLS - Isolamento de dados por usuário (auth.uid())
-- ====================================================================
-- PROBLEMA: Todas as policies anteriores usavam USING(true), permitindo
-- que qualquer usuário autenticado visse dados de outros usuários.
-- SOLUÇÃO: Restringir cada tabela ao user_id do usuário logado.
-- ====================================================================

-- ─── TABELA: medicos ─────────────────────────────────────────────────
-- Garante que user_id existe na tabela (pode já existir)
ALTER TABLE public.medicos ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Remove policies antigas abertas
DROP POLICY IF EXISTS "Leitura de médicos para todos" ON public.medicos;
DROP POLICY IF EXISTS "Inserção de médicos para todos" ON public.medicos;
DROP POLICY IF EXISTS "Atualização de médicos para todos" ON public.medicos;
DROP POLICY IF EXISTS "Exclusão de médicos para todos" ON public.medicos;
DROP POLICY IF EXISTS "Permitir leitura para todos" ON public.medicos;
DROP POLICY IF EXISTS "Permitir inserção para todos" ON public.medicos;
DROP POLICY IF EXISTS "Permitir atualização para todos" ON public.medicos;
DROP POLICY IF EXISTS "Permitir exclusão para todos" ON public.medicos;
DROP POLICY IF EXISTS "Médicos visíveis pelo próprio usuário" ON public.medicos;
DROP POLICY IF EXISTS "Inserção de médico pelo próprio usuário" ON public.medicos;
DROP POLICY IF EXISTS "Atualização de médico pelo próprio usuário" ON public.medicos;
DROP POLICY IF EXISTS "Exclusão de médico pelo próprio usuário" ON public.medicos;

-- Habilita RLS (idempotente)
ALTER TABLE public.medicos ENABLE ROW LEVEL SECURITY;

-- Novas policies seguras
CREATE POLICY "Médicos visíveis pelo próprio usuário"
ON public.medicos FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Inserção de médico pelo próprio usuário"
ON public.medicos FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Atualização de médico pelo próprio usuário"
ON public.medicos FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Exclusão de médico pelo próprio usuário"
ON public.medicos FOR DELETE
USING (auth.uid() = user_id);


-- ─── TABELA: pacientes ───────────────────────────────────────────────
-- Pacientes pertencem a um médico; médico pertence ao user_id.
-- Usamos subquery para verificar se o médico pertence ao usuário logado.
ALTER TABLE public.pacientes ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

DROP POLICY IF EXISTS "Leitura de pacientes para todos" ON public.pacientes;
DROP POLICY IF EXISTS "Inserção de pacientes para todos" ON public.pacientes;
DROP POLICY IF EXISTS "Atualização de pacientes para todos" ON public.pacientes;
DROP POLICY IF EXISTS "Exclusão de pacientes para todos" ON public.pacientes;
DROP POLICY IF EXISTS "Pacientes visíveis pelo próprio usuário" ON public.pacientes;
DROP POLICY IF EXISTS "Inserção de paciente pelo próprio usuário" ON public.pacientes;
DROP POLICY IF EXISTS "Atualização de paciente pelo próprio usuário" ON public.pacientes;
DROP POLICY IF EXISTS "Exclusão de paciente pelo próprio usuário" ON public.pacientes;

ALTER TABLE public.pacientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pacientes visíveis pelo próprio usuário"
ON public.pacientes FOR SELECT
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.medicos m
    WHERE m.id = pacientes.medico_id
    AND m.user_id = auth.uid()
  )
);

CREATE POLICY "Inserção de paciente pelo próprio usuário"
ON public.pacientes FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.medicos m
    WHERE m.id = pacientes.medico_id
    AND m.user_id = auth.uid()
  )
);

CREATE POLICY "Atualização de paciente pelo próprio usuário"
ON public.pacientes FOR UPDATE
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.medicos m
    WHERE m.id = pacientes.medico_id
    AND m.user_id = auth.uid()
  )
);

CREATE POLICY "Exclusão de paciente pelo próprio usuário"
ON public.pacientes FOR DELETE
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.medicos m
    WHERE m.id = pacientes.medico_id
    AND m.user_id = auth.uid()
  )
);


-- ─── TABELA: notas_fiscais ───────────────────────────────────────────
DROP POLICY IF EXISTS "Permitir leitura para todos" ON public.notas_fiscais;
DROP POLICY IF EXISTS "Permitir inserção para todos" ON public.notas_fiscais;
DROP POLICY IF EXISTS "Permitir atualização para todos" ON public.notas_fiscais;
DROP POLICY IF EXISTS "Permitir exclusão para todos" ON public.notas_fiscais;
DROP POLICY IF EXISTS "Notas visíveis pelo próprio usuário" ON public.notas_fiscais;
DROP POLICY IF EXISTS "Inserção de nota pelo próprio usuário" ON public.notas_fiscais;
DROP POLICY IF EXISTS "Atualização de nota pelo próprio usuário" ON public.notas_fiscais;
DROP POLICY IF EXISTS "Exclusão de nota pelo próprio usuário" ON public.notas_fiscais;

ALTER TABLE public.notas_fiscais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Notas visíveis pelo próprio usuário"
ON public.notas_fiscais FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.medicos m
    WHERE m.id = notas_fiscais.medico_id
    AND m.user_id = auth.uid()
  )
);

CREATE POLICY "Inserção de nota pelo próprio usuário"
ON public.notas_fiscais FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.medicos m
    WHERE m.id = notas_fiscais.medico_id
    AND m.user_id = auth.uid()
  )
);

CREATE POLICY "Atualização de nota pelo próprio usuário"
ON public.notas_fiscais FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.medicos m
    WHERE m.id = notas_fiscais.medico_id
    AND m.user_id = auth.uid()
  )
);

CREATE POLICY "Exclusão de nota pelo próprio usuário"
ON public.notas_fiscais FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.medicos m
    WHERE m.id = notas_fiscais.medico_id
    AND m.user_id = auth.uid()
  )
);


-- ─── TABELA: assinaturas ─────────────────────────────────────────────
DROP POLICY IF EXISTS "Leitura de assinaturas para todos" ON public.assinaturas;
DROP POLICY IF EXISTS "Atualização de assinaturas para todos" ON public.assinaturas;
DROP POLICY IF EXISTS "Assinaturas visíveis pelo próprio usuário" ON public.assinaturas;
DROP POLICY IF EXISTS "Gestão de assinatura pelo próprio usuário" ON public.assinaturas;

ALTER TABLE public.assinaturas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Assinaturas visíveis pelo próprio usuário"
ON public.assinaturas FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Gestão de assinatura pelo próprio usuário"
ON public.assinaturas FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);


-- ─── TABELA: faturas_cobranca ────────────────────────────────────────
DROP POLICY IF EXISTS "Gestão de faturas para todos" ON public.faturas_cobranca;
DROP POLICY IF EXISTS "Faturas visíveis pelo próprio usuário" ON public.faturas_cobranca;
DROP POLICY IF EXISTS "Gestão de fatura pelo próprio usuário" ON public.faturas_cobranca;

ALTER TABLE public.faturas_cobranca ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Faturas visíveis pelo próprio usuário"
ON public.faturas_cobranca FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.assinaturas a
    WHERE a.id = faturas_cobranca.assinatura_id
    AND a.user_id = auth.uid()
  )
);

CREATE POLICY "Gestão de fatura pelo próprio usuário"
ON public.faturas_cobranca FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.assinaturas a
    WHERE a.id = faturas_cobranca.assinatura_id
    AND a.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.assinaturas a
    WHERE a.id = faturas_cobranca.assinatura_id
    AND a.user_id = auth.uid()
  )
);


-- ─── TABELA: planos (pública, sem restrição de usuário) ──────────────
-- Planos são globais (todos podem ler, ninguém insere pelo frontend)
DROP POLICY IF EXISTS "Leitura de planos para todos" ON public.planos;
ALTER TABLE public.planos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leitura de planos para todos" ON public.planos FOR SELECT USING (true);


-- ─── ÍNDICES: user_id nas tabelas principais ─────────────────────────
CREATE INDEX IF NOT EXISTS idx_medicos_user_id ON public.medicos(user_id);
CREATE INDEX IF NOT EXISTS idx_pacientes_user_id ON public.pacientes(user_id);
