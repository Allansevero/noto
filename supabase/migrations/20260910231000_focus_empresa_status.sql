-- Adiciona colunas para rastrear a empresa e o certificado na Focus NFe
ALTER TABLE public.medico_dados_fiscais 
  ADD COLUMN IF NOT EXISTS focus_empresa_id VARCHAR(50),
  ADD COLUMN IF NOT EXISTS focus_empresa_status VARCHAR(50),
  ADD COLUMN IF NOT EXISTS certificado_validado_em TIMESTAMPTZ;
