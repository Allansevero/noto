export type PlanId = "basico" | "profissional" | "agencia";

export type SubscriptionStatus = "ativa" | "trial" | "atrasada" | "cancelada";

export type InvoicePaymentStatus = "Paga" | "Pendente" | "Atrasada" | "Cancelada";

export type PaymentMethod = "PIX" | "Cartão de Crédito" | "Boleto";

export interface Plan {
  id: PlanId;
  nome: string;
  perfil_cliente: string;
  descricao?: string;
  cnpjs_inclusos: number;
  notas_mes_limite: number;
  preco_mensal: number;
  custo_api_estimado: number;
  lucro_estimado: number;
  margem_percentual: number;
  recursos: string[];
  destaque?: boolean;
  ordem?: number;
  checkout_url?: string;
}

export interface Subscription {
  id: string;
  user_id?: string;
  plano_id: PlanId;
  status: SubscriptionStatus;
  data_inicio: string;
  data_vencimento: string;
  data_proxima_cobranca: string;
  metodo_pagamento: PaymentMethod;
  cnpjs_utilizados: number;
  notas_emitidas_mes_atual: number;
  created_at?: string;
  updated_at?: string;
  plano?: Plan;
}

export interface BillingInvoice {
  id: string;
  assinatura_id: string;
  numero_fatura: string;
  valor: number;
  data_emissao: string;
  data_vencimento: string;
  data_pagamento?: string | null;
  status: InvoicePaymentStatus;
  metodo_pagamento: PaymentMethod;
  comprovante_url?: string | null;
  pix_copia_cola?: string | null;
}

export interface UsageQuota {
  cnpjsUsados: number;
  cnpjsLimite: number;
  cnpjsPercentual: number;
  notasUsadas: number;
  notasLimite: number;
  notasPercentual: number;
  diasParaVencimento: number;
  estaProximoDoVencimento: boolean;
  atingiuLimiteCnpjs: boolean;
  atingiuLimiteNotas: boolean;
}
