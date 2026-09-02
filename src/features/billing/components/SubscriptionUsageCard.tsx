import type { Subscription, UsageQuota } from "../types";
import { formatMoney } from "../services/billing.service";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Building2,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Zap,
  Info,
} from "lucide-react";

interface SubscriptionUsageCardProps {
  subscription: Subscription | null;
  quota: UsageQuota;
  onOpenUpgradeModal: () => void;
}

export function SubscriptionUsageCard({
  subscription,
  quota,
  onOpenUpgradeModal,
}: SubscriptionUsageCardProps) {
  // Caso o usuário ainda não tenha nenhum plano contratado no Supabase
  if (!subscription) {
    return (
      <div className="p-5 border border-border bg-card shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 shrink-0">
            <Info className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-display font-bold text-foreground">
                Nenhum Plano Ativo no Momento
              </h2>
              <span
                className="px-2 py-0.5 text-[10px] font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                style={{ borderRadius: "100px" }}
              >
                Pendente
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 max-w-xl leading-relaxed">
              Você ainda não possui uma assinatura registrada no Supabase. Selecione um dos planos oficiais abaixo (Básico, Profissional ou Agência) para ativar sua cota de CNPJs e emissões de NFS-e.
            </p>
          </div>
        </div>

        <Button
          size="sm"
          onClick={onOpenUpgradeModal}
          className="h-8 text-xs rounded-none font-semibold bg-[#B7F20B] hover:bg-[#B7F20B]/90 text-black gap-1.5 shadow-xs shrink-0"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Escolher um Plano</span>
        </Button>
      </div>
    );
  }

  const plan = subscription.plano;

  const dataVencimentoFormatted = subscription.data_vencimento
    ? new Date(subscription.data_vencimento).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "-";

  return (
    <div className="p-5 border border-border bg-card shadow-xs space-y-5">
      {/* Topo: Informações do Plano Atual & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 bg-[#B7F20B]/10 border border-[#B7F20B]/30 text-foreground shrink-0">
            <Zap className="h-5 w-5 text-[#B7F20B]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Sua Assinatura Ativa
              </span>
              <span
                className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 inline-flex items-center gap-1"
                style={{ borderRadius: "100px" }}
              >
                <CheckCircle2 className="h-3 w-3" />
                <span>{subscription.status === "ativa" ? "Plano Ativo" : subscription.status}</span>
              </span>
            </div>
            <h2 className="text-xl font-display font-bold text-foreground flex items-center gap-2 mt-0.5">
              Plano {plan?.nome || "Profissional"}
              <span className="text-sm font-sans font-normal text-muted-foreground">
                ({formatMoney(plan?.preco_mensal || 547)}/mês)
              </span>
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="text-right hidden sm:block">
            <span className="text-[11px] text-muted-foreground block">Próxima Renovação</span>
            <span className="text-xs font-mono font-medium text-foreground flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              {dataVencimentoFormatted} ({quota.diasParaVencimento} dias)
            </span>
          </div>

          <Button
            size="sm"
            onClick={onOpenUpgradeModal}
            className="h-8 text-xs rounded-none font-semibold bg-[#B7F20B] hover:bg-[#B7F20B]/90 text-black gap-1.5 shadow-xs"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Mudar de Plano</span>
          </Button>
        </div>
      </div>

      {/* Alerta se estiver próximo do vencimento ou atingindo cotas */}
      {quota.estaProximoDoVencimento && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 flex items-center gap-2 text-xs">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>
            Sua fatura mensal vence em <strong>{quota.diasParaVencimento} dias</strong> ({dataVencimentoFormatted}). Mantenha o pagamento em dia para evitar bloqueios na emissão.
          </span>
        </div>
      )}

      {/* Grid de Barras de Consumo de Cota */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
        {/* 1. Cota de Médicos / CNPJs */}
        <div className="p-4 border border-border bg-background/60 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-muted-foreground flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
              CNPJs de Médicos Cadastrados
            </span>
            <span className="font-mono font-semibold text-foreground">
              {quota.cnpjsUsados} / {quota.cnpjsLimite} ({quota.cnpjsPercentual}%)
            </span>
          </div>

          {/* Barra de Progresso */}
          <div className="h-2 w-full bg-muted overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                quota.cnpjsPercentual >= 90
                  ? "bg-red-500"
                  : quota.cnpjsPercentual >= 70
                  ? "bg-amber-500"
                  : "bg-[#B7F20B]"
              }`}
              style={{ width: `${Math.min(quota.cnpjsPercentual, 100)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>
              {quota.cnpjsLimite - quota.cnpjsUsados > 0
                ? `${quota.cnpjsLimite - quota.cnpjsUsados} vaga(s) disponível(is)`
                : "Limite de CNPJs atingido"}
            </span>
            {quota.atingiuLimiteCnpjs && (
              <span className="text-amber-500 font-semibold cursor-pointer hover:underline" onClick={onOpenUpgradeModal}>
                Fazer Upgrade ➔
              </span>
            )}
          </div>
        </div>

        {/* 2. Cota de Notas Fiscais no Mês */}
        <div className="p-4 border border-border bg-background/60 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-muted-foreground flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
              Notas Fiscais Emitidas (Ciclo Atual)
            </span>
            <span className="font-mono font-semibold text-foreground">
              {quota.notasUsadas} / {quota.notasLimite} ({quota.notasPercentual}%)
            </span>
          </div>

          {/* Barra de Progresso */}
          <div className="h-2 w-full bg-muted overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                quota.notasPercentual >= 90
                  ? "bg-red-500"
                  : quota.notasPercentual >= 70
                  ? "bg-amber-500"
                  : "bg-[#B7F20B]"
              }`}
              style={{ width: `${Math.min(quota.notasPercentual, 100)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>
              {quota.notasLimite - quota.notasUsadas > 0
                ? `${(quota.notasLimite - quota.notasUsadas).toLocaleString("pt-BR")} notas restantes este mês`
                : "Cota mensal esgotada"}
            </span>
            {quota.atingiuLimiteNotas && (
              <span className="text-amber-500 font-semibold cursor-pointer hover:underline" onClick={onOpenUpgradeModal}>
                Aumentar Cota ➔
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
