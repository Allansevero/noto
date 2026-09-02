import type { Subscription, UsageQuota } from "../types";

/**
 * Calcula os indicadores de consumo e prazos da assinatura
 */
export function calculateUsageQuota(
  subscription: Subscription,
  medicosCadastradosCount: number,
  notasEmitidasMesCount: number
): UsageQuota {
  const plan = subscription.plano;
  const cnpjsLimite = plan?.cnpjs_inclusos || 5;
  const notasLimite = plan?.notas_mes_limite || 1500;

  const cnpjsUsados = Math.max(medicosCadastradosCount, subscription.cnpjs_utilizados || 0);
  const notasUsadas = Math.max(notasEmitidasMesCount, subscription.notas_emitidas_mes_atual || 0);

  const cnpjsPercentual = Math.min(Math.round((cnpjsUsados / cnpjsLimite) * 100), 100);
  const notasPercentual = Math.min(Math.round((notasUsadas / notasLimite) * 100), 100);

  // Cálculo de dias até o vencimento
  const now = new Date();
  const vencimento = new Date(subscription.data_vencimento || subscription.data_proxima_cobranca);
  const diffTime = vencimento.getTime() - now.getTime();
  const diasParaVencimento = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  return {
    cnpjsUsados,
    cnpjsLimite,
    cnpjsPercentual,
    notasUsadas,
    notasLimite,
    notasPercentual,
    diasParaVencimento,
    estaProximoDoVencimento: diasParaVencimento <= 5,
    atingiuLimiteCnpjs: cnpjsUsados >= cnpjsLimite,
    atingiuLimiteNotas: notasUsadas >= notasLimite,
  };
}

/**
 * Formata moeda BRL
 */
export function formatMoney(val: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(val);
}
