export type BillingPeriod = "mensal" | "anual"

export interface PlanFeature {
  text: string
  included: boolean
  highlight?: boolean
  detail?: string
}

export interface DoctorPlanPricing {
  periodo: BillingPeriod
  valorMensal: number
  valorTotal: number
  economiaPercentual?: number
  notasMes: number
  armazenamentoDias: number
  secretariasQtd: number
  clinicasQtd: number
  contadoresQtd: number
}

export interface SecretaryPlanPricing {
  medicosBase: number
  medicosExtras: number
  medicosTotal: number
  valorBase: number
  valorPorMedicoExtra: number
  valorTotalMensal: number
  notasTotal: number
  armazenamentoDias: number
  membrosExtras: number
}

export interface SubscriptionInfo {
  id: string
  medicoId: string
  planoNome: string
  status: "trial" | "ativa" | "atrasada" | "cancelada" | "sem_assinatura"
  periodo?: BillingPeriod
  dataInicio?: string
  diaVencimento?: number
}
