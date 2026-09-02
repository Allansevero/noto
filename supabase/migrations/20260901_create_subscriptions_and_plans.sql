-- ====================================================================
-- MIGRATION: Tabelas de Planos, Assinaturas e Cobranças (Billing SaaS)
-- ====================================================================

-- 1. Tabela de Planos de Assinatura
CREATE TABLE IF NOT EXISTS public.planos (
    id TEXT PRIMARY KEY, -- 'basico', 'profissional', 'agencia'
    nome TEXT NOT NULL,
    perfil_cliente TEXT NOT NULL,
    descricao TEXT,
    cnpjs_inclusos INTEGER NOT NULL,
    notas_mes_limite INTEGER NOT NULL,
    preco_mensal NUMERIC(10, 2) NOT NULL,
    custo_api_estimado NUMERIC(10, 2) NOT NULL,
    lucro_estimado NUMERIC(10, 2) NOT NULL,
    margem_percentual NUMERIC(5, 2) NOT NULL,
    recursos JSONB DEFAULT '[]'::jsonb,
    destaque BOOLEAN DEFAULT false,
    ordem INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Inserção dos Planos Oficiais
INSERT INTO public.planos (id, nome, perfil_cliente, descricao, cnpjs_inclusos, notas_mes_limite, preco_mensal, custo_api_estimado, lucro_estimado, margem_percentual, recursos, destaque, ordem)
VALUES
    (
        'basico',
        'Básico',
        'Carteira pequena (1 a 3 médicos)',
        'Ideal para secretárias que gerenciam até 3 médicos e faturamento inicial.',
        3,
        500,
        297.00,
        153.90,
        143.10,
        48.00,
        '["Até 3 CNPJs cadastrados", "500 notas fiscais por mês", "Importação de XML de notas anteriores", "Download de DANFSe (PDF) e XML", "Suporte por e-mail e WhatsApp"]'::jsonb,
        false,
        1
    ),
    (
        'profissional',
        'Profissional',
        'Carteira cheia (Volume alvo)',
        'O plano mais popular para secretárias com alta demanda de consultas e emissões diárias.',
        5,
        1500,
        547.00,
        329.70,
        217.30,
        39.00,
        '["Até 5 CNPJs cadastrados", "1.500 notas fiscais por mês", "Emissão com 1 clique e data personalizada", "Central de NFS-e e cancelamento integrado", "Alertas automáticos de vencimento e cotas", "Suporte prioritário"]'::jsonb,
        true,
        2
    ),
    (
        'agencia',
        'Agência',
        'Expansão / Múltiplas assistentes',
        'Para escritórios de assessoria médica, clínicas em rede e múltiplos assistentes.',
        15,
        4000,
        1197.00,
        740.00,
        457.00,
        38.00,
        '["Até 15 CNPJs cadastrados", "4.000 notas fiscais por mês", "Múltiplos emissores e clínicas médicas", "Relatórios consolidados para contabilidade", "Gestão avançada de faturas e comprovantes", "Gerente de conta exclusivo"]'::jsonb,
        false,
        3
    )
ON CONFLICT (id) DO UPDATE SET
    nome = EXCLUDED.nome,
    perfil_cliente = EXCLUDED.perfil_cliente,
    descricao = EXCLUDED.descricao,
    cnpjs_inclusos = EXCLUDED.cnpjs_inclusos,
    notas_mes_limite = EXCLUDED.notas_mes_limite,
    preco_mensal = EXCLUDED.preco_mensal,
    custo_api_estimado = EXCLUDED.custo_api_estimado,
    lucro_estimado = EXCLUDED.lucro_estimado,
    margem_percentual = EXCLUDED.margem_percentual,
    recursos = EXCLUDED.recursos,
    destaque = EXCLUDED.destaque;

-- 2. Tabela de Assinaturas dos Usuários/Clientes
CREATE TABLE IF NOT EXISTS public.assinaturas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    plano_id TEXT REFERENCES public.planos(id) DEFAULT 'profissional',
    status TEXT NOT NULL DEFAULT 'ativa', -- 'ativa', 'trial', 'atrasada', 'cancelada'
    data_inicio TIMESTAMPTZ DEFAULT now(),
    data_vencimento TIMESTAMPTZ DEFAULT (now() + INTERVAL '30 days'),
    data_proxima_cobranca TIMESTAMPTZ DEFAULT (now() + INTERVAL '30 days'),
    metodo_pagamento TEXT DEFAULT 'PIX', -- 'PIX', 'Cartão de Crédito', 'Boleto'
    cnpjs_utilizados INTEGER DEFAULT 0,
    notas_emitidas_mes_atual INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Tabela de Histórico de Cobranças / Faturas
CREATE TABLE IF NOT EXISTS public.faturas_cobranca (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assinatura_id UUID REFERENCES public.assinaturas(id) ON DELETE CASCADE,
    numero_fatura TEXT NOT NULL,
    valor NUMERIC(10, 2) NOT NULL,
    data_emissao TIMESTAMPTZ DEFAULT now(),
    data_vencimento TIMESTAMPTZ NOT NULL,
    data_pagamento TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'Pendente', -- 'Paga', 'Pendente', 'Atrasada', 'Cancelada'
    metodo_pagamento TEXT DEFAULT 'PIX',
    comprovante_url TEXT,
    pix_copia_cola TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.planos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assinaturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faturas_cobranca ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leitura de planos para todos" ON public.planos FOR SELECT USING (true);
CREATE POLICY "Leitura de assinaturas para todos" ON public.assinaturas FOR SELECT USING (true);
CREATE POLICY "Atualização de assinaturas para todos" ON public.assinaturas FOR ALL USING (true);
CREATE POLICY "Gestão de faturas para todos" ON public.faturas_cobranca FOR ALL USING (true);
