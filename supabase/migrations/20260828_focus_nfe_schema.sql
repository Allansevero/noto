-- ==============================================================================
-- Script de Migração Corrigido: Integração com Focus NFe (NFS-e)
-- ==============================================================================

-- 1. Atualizar o tipo ENUM patient_status existente no PostgreSQL
ALTER TYPE patient_status ADD VALUE IF NOT EXISTS 'Processando emissão';
ALTER TYPE patient_status ADD VALUE IF NOT EXISTS 'Erro na emissão';

-- 2. Atualizar campos da tabela de médicos com dados fiscais
ALTER TABLE medicos
ADD COLUMN IF NOT EXISTS focus_empresa_id TEXT,
ADD COLUMN IF NOT EXISTS focus_token TEXT,
ADD COLUMN IF NOT EXISTS ambiente_nf TEXT DEFAULT 'homologacao',
ADD COLUMN IF NOT EXISTS item_lista_servico TEXT DEFAULT '0401',
ADD COLUMN IF NOT EXISTS aliquota_iss NUMERIC(5, 2) DEFAULT 3.00,
ADD COLUMN IF NOT EXISTS optante_simples_nacional BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS regime_especial_tributacao TEXT,
ADD COLUMN IF NOT EXISTS codigo_tributario_municipio TEXT,
ADD COLUMN IF NOT EXISTS codigo_municipio_ibge TEXT;

-- 3. Atualizar campos da tabela de pacientes para controle da NFS-e
ALTER TABLE pacientes
ADD COLUMN IF NOT EXISTS focus_ref TEXT,
ADD COLUMN IF NOT EXISTS nfse_numero TEXT,
ADD COLUMN IF NOT EXISTS nfse_pdf_url TEXT,
ADD COLUMN IF NOT EXISTS nfse_xml_url TEXT,
ADD COLUMN IF NOT EXISTS nfse_erro_motivo TEXT,
ADD COLUMN IF NOT EXISTS nfse_data_emissao TIMESTAMPTZ;

-- 4. Habilitar Realtime para a tabela pacientes
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'pacientes'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE pacientes;
    END IF;
END $$;
