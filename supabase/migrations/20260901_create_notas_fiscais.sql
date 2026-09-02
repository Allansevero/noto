-- ====================================================================
-- MIGRATION: Criação da Tabela Oficial de Notas Fiscais (notas_fiscais)
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.notas_fiscais (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    medico_id UUID REFERENCES public.medicos(id) ON DELETE CASCADE,
    paciente_id UUID REFERENCES public.pacientes(id) ON DELETE CASCADE,
    
    -- Identificadores Oficiais da NFS-e / DPS
    numero_nfse TEXT,
    numero_dps TEXT,
    serie_dps TEXT DEFAULT '1',
    chave_acesso TEXT,
    codigo_verificacao TEXT,
    focus_ref TEXT NOT NULL UNIQUE,
    
    -- Status da Nota Fiscal
    status TEXT NOT NULL DEFAULT 'Processando emissão', -- 'Processando emissão', 'Nota Gerada', 'Erro na emissão', 'Nota Cancelada'
    
    -- Valores e Tributação
    valor_servico NUMERIC(10, 2) NOT NULL,
    aliquota_iss NUMERIC(5, 2) DEFAULT 2.00,
    valor_iss NUMERIC(10, 2),
    tributos_federais NUMERIC(10, 2),
    tributos_municipais NUMERIC(10, 2),
    
    -- Classificação Fiscal
    item_lista_servico TEXT DEFAULT '041601',
    codigo_nbs TEXT DEFAULT '1.2301.13.00',
    discriminacao TEXT,
    
    -- Datas
    data_competencia DATE NOT NULL DEFAULT CURRENT_DATE,
    data_emissao TIMESTAMPTZ DEFAULT now(),
    data_autorizacao TIMESTAMPTZ,
    
    -- Arquivos e Documentos Oficiais
    pdf_url TEXT,
    xml_url TEXT,
    erro_motivo TEXT,
    
    -- Ambiente
    ambiente TEXT DEFAULT 'homologacao', -- 'homologacao' | 'producao'
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.notas_fiscais ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso
CREATE POLICY "Permitir leitura para todos" 
ON public.notas_fiscais FOR SELECT 
USING (true);

CREATE POLICY "Permitir inserção para todos" 
ON public.notas_fiscais FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Permitir atualização para todos" 
ON public.notas_fiscais FOR UPDATE 
USING (true);

CREATE POLICY "Permitir exclusão para todos" 
ON public.notas_fiscais FOR DELETE 
USING (true);

-- Índices para Performance e Consultas Rápidas
CREATE INDEX IF NOT EXISTS idx_notas_fiscais_medico_id ON public.notas_fiscais(medico_id);
CREATE INDEX IF NOT EXISTS idx_notas_fiscais_paciente_id ON public.notas_fiscais(paciente_id);
CREATE INDEX IF NOT EXISTS idx_notas_fiscais_status ON public.notas_fiscais(status);
CREATE INDEX IF NOT EXISTS idx_notas_fiscais_focus_ref ON public.notas_fiscais(focus_ref);
