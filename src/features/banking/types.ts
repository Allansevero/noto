export interface ContaBancaria {
  id: string
  medico_id: string
  pluggy_item_id: string
  pluggy_account_id: string
  banco_codigo?: string | null
  banco_nome: string
  agencia?: string | null
  numero_conta: string
  tipo_conta?: string | null
  saldo: number
  moeda: string
  ativa_para_recebimento: boolean
  status_conexao: string
  criado_em?: string
  atualizado_em?: string
}

export interface PluggyAccountRaw {
  id: string
  type: string
  subtype?: string
  name: string
  balance: number
  currencyCode: string
  itemId: string
  number: string
  agency?: string
  bankData?: {
    transferNumber?: string
    closingBalance?: number
  }
}

export interface ConnectTokenResponse {
  success: boolean
  connectToken?: string
  error?: string
}

export interface SyncAccountsResponse {
  success: boolean
  contas: ContaBancaria[]
  error?: string
}
