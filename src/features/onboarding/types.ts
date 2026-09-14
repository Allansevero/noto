export interface ExtractedFiscalData {
  cnpj?: string
  razao_social?: string
  logradouro?: string
  numero?: string
  complemento?: string
  bairro?: string
  codigo_municipio_ibge?: string
  uf?: string
  cep?: string
  telefone?: string
  email?: string
  opcao_simples_nacional?: string
  regime_especial_tributacao?: string
  codigo_municipio_emissao?: string
  codigo_tributacao_nacional?: string
  codigo_nbs?: string
  tributacao_issqn?: string
  tipo_retencao_issqn?: string
  aliquota_iss_referencia?: number
  pct_trib_federal_referencia?: number
  ultima_nota_numero?: number
  ultimo_xml_processado_em?: string
  focus_empresa_id?: string | null
  focus_empresa_status?: string | null
  certificado_validado_em?: string | null
}

export interface SaveFiscalResult {
  success: boolean
  error?: string
}
