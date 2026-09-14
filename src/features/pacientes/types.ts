export interface Paciente {
  id: string
  medico_id: string
  clinica_id?: string | null
  nome: string
  cpf?: string | null
  email?: string | null
  telefone?: string | null
  valor_consulta?: number | null
  pagador_secundario_nome?: string | null
  pagador_secundario_cpf?: string | null
  arquivado?: boolean
  criado_em?: string
  total_notas?: number
}

export interface CriarPacienteInput {
  nome: string
  cpf?: string
  email?: string
  telefone?: string
  valor_consulta?: number | null
  pagador_secundario_nome?: string | null
  pagador_secundario_cpf?: string | null
}

export interface AtualizarPacienteInput {
  nome?: string
  cpf?: string
  email?: string
  telefone?: string
  valor_consulta?: number | null
  pagador_secundario_nome?: string | null
  pagador_secundario_cpf?: string | null
  arquivado?: boolean
}

export interface PacienteNotaSummary {
  id: string
  numero_rps?: string
  numero_nfse?: string
  valor_servico: number
  data_emissao?: string
  status: string
  pdf_url?: string
}
