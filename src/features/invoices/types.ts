export interface TomadorData {
  nome: string
  cpfCnpj: string
  email?: string
  telefone?: string
  logradouro?: string
  numero?: string
  bairro?: string
  cep?: string
  codigoMunicipio?: string
}

export interface CheckPaymentResult {
  pago: boolean
  conciliado?: boolean
  transacao?: {
    id: string
    descricao: string
    valor: number
    data: string
    tipo?: string
    pagador?: string
  }
  motivo?: string
  mensagem?: string
  jaFaturado?: boolean
  error?: string
}

export interface EmitirNotaResult {
  success: boolean
  referencia?: string
  status?: string
  numeroNfse?: string | number
  codigoVerificacao?: string
  caminhoDanfe?: string
  caminhoXml?: string
  transacaoId?: string
  dataPagamento?: string
  ambiente?: string
  mensagem?: string
  error?: string
}

