export interface TopPacienteNotas {
  id: string
  nome: string
  total_notas: number
  avatar_url?: string
}

export interface NotasEmitidasProgressData {
  totalNotas: number
  targetNotas: number
  progressPercent: number
  valorTotalEmitido: number
  topPacientes: TopPacienteNotas[]
  isLoading: boolean
}
