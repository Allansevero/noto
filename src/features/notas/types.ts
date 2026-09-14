export type NotaStatus = "autorizada" | "processando" | "cancelada" | "erro"
export type AmbienteFiscal = "homologacao" | "producao"
export type ExecutadaPor = "open_finance" | "manual"
export type StatusEnvio = "enviado" | "nao_enviado"

export interface NotaFiscal {
  id: string
  medico_id?: string
  clinica_id?: string
  clinica_nome?: string
  /** Numero sequencial RPS */
  numero_rps: string
  /** Numero da nota na prefeitura (apos autorizacao) */
  numero_nfse?: string
  /** Nome do tomador / paciente */
  tomador_nome: string
  /** CPF do tomador */
  tomador_cpf?: string
  /** Valor dos servicos em reais */
  valor_servico: number
  /** Data de competencia (ISO string) */
  data_competencia: string
  /** Data de emissao pela prefeitura */
  data_emissao?: string
  status: NotaStatus
  /** Codigo de verificacao da nota */
  codigo_verificacao?: string
  /** URL do PDF DANFSE, se disponivel */
  pdf_url?: string
  /** URL do XML assinado, se disponivel */
  xml_url?: string
  /** Ambiente da nota: homologacao (sandbox) ou producao (real) */
  ambiente: AmbienteFiscal
  /** Origem de execucao da emissao: Noto Sync (automático via Pluggy) ou Manual */
  executada_por: ExecutadaPor
  /** Status de envio da nota ao paciente: enviado ou nao_enviado */
  status_envio: StatusEnvio
  /** Data em que a nota foi enviada ao paciente */
  enviado_em?: string
  /** Referência única da nota na API Focus NFe */
  referencia_focus?: string
  /** Justificativa informada no cancelamento da nota */
  justificativa_cancelamento?: string
}

export interface ListNotasFilter {
  medico_id?: string
  ambiente?: AmbienteFiscal
  status?: NotaStatus
  page?: number
  pageSize?: number
}

export interface ListNotasResult {
  data: NotaFiscal[]
  total: number
}

export interface GerarNotaInput {
  paciente_id?: string
  tomador_nome: string
  tomador_cpf?: string
  valor_servico: number
  data_emissao?: string
  discriminacao?: string
  descricao_adicional?: string
  ambiente?: AmbienteFiscal
  clinica_id?: string
  executada_por?: ExecutadaPor
}

export interface Paciente {
  id: string
  nome: string
  cpf?: string
  email?: string
  telefone?: string
}

export interface GerarNotasLoteInput {
  pacientes: { id?: string; nome: string; cpf?: string }[]
  valor_servico: number
  data_emissao?: string
  discriminacao?: string
  descricao_adicional?: string
  ambiente?: AmbienteFiscal
  clinica_id?: string
  executada_por?: ExecutadaPor
}

