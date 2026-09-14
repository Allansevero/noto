export type SyncOrigem = 'webhook' | 'cron' | 'manual'
export type SyncStatus = 'sucesso' | 'sem_movimentacao' | 'aviso' | 'erro'

export interface NotoSyncLog {
  id: string
  medico_id: string
  origem: SyncOrigem
  status: SyncStatus
  transacoes_analisadas: number
  notas_emitidas: number
  mensagem?: string | null
  detalhes?: Record<string, any> | null
  criado_em: string
}

export interface CriarSyncLogInput {
  medico_id: string
  origem: SyncOrigem
  status: SyncStatus
  transacoes_analisadas: number
  notas_emitidas: number
  mensagem?: string
  detalhes?: Record<string, any>
}

export interface SyncStats {
  totalNotasAutomaticas: number
  volumeFaturadoAutomatico: number
  contasMonitoradas: number
  ultimaSincronizacao: string | null
  statusRobo: 'ativo' | 'inativo' | 'atencao'
  webhookAtivo: boolean
}

export interface PluggyTransactionPayer {
  name?: string
  documentNumber?: {
    type?: string
    value?: string
  }
}

export interface PluggyTransactionPaymentData {
  payer?: PluggyTransactionPayer
  receiver?: {
    name?: string
    documentNumber?: {
      type?: string
      value?: string
    }
  }
  paymentMethod?: string
}

export interface PluggyTransaction {
  id: string
  accountId: string
  description?: string
  descriptionRaw?: string
  amount: number
  date: string
  type: 'CREDIT' | 'DEBIT'
  status?: string
  paymentData?: PluggyTransactionPaymentData
}

export interface ConciliacaoResult {
  transacaoId: string
  valor: number
  dataTransacao: string
  pacienteId: string
  pacienteNome: string
  pacienteCpf?: string | null
  notaFiscalId?: string | null
  numeroNfse?: string | null
  status: 'emitida' | 'ja_faturada' | 'anterior_ao_cadastro' | 'erro'
  motivo: string
}
