export interface DoctorProfile {
  id: string
  owner_user_id: string
  nome_completo: string
  cnpj: string | null
  status: "ativo" | "bloqueado" | "cancelado"
  plano_id?: string
  email?: string
  avatar_url?: string
  telefone?: string
  username?: string
  plano_nome?: string
  onboarding_concluido: boolean
  primeiro_acesso: boolean
}

export interface LoginResult {
  success: boolean
  error?: string
  doctor?: DoctorProfile
}
