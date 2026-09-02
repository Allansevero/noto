import type { Plan, PlanId } from "../types";
import { formatMoney } from "../services/billing.service";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight } from "lucide-react";

interface PlanCardsGridProps {
  plans: Plan[];
  currentPlanId: PlanId;
  onSelectPlan: (plan: Plan) => void;
}

export function PlanCardsGrid({ plans, currentPlanId, onSelectPlan }: PlanCardsGridProps) {
  return (
    <div className="space-y-4 w-full">
      <div className="flex flex-col gap-1">
        <h3 className="text-lg font-display font-bold text-foreground">
          Planos de Assinatura Disponíveis
        </h3>
        <p className="text-xs text-muted-foreground font-sans">
          Escolha o plano ideal para a quantidade de médicos que você gerencia e o volume de consultas da sua clínica.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
        {plans.map((plan) => {
          const isCurrent = plan.id === currentPlanId;
          const isDestacado = plan.destaque;

          return (
            <div
              key={plan.id}
              className={`relative p-5 border flex flex-col justify-between transition-all rounded-none ${
                isDestacado
                  ? "border-[#B7F20B] bg-[#B7F20B]/5 shadow-sm ring-1 ring-[#B7F20B]/40"
                  : isCurrent
                  ? "border-border bg-card ring-1 ring-border"
                  : "border-border bg-card hover:border-border/80"
              }`}
            >
              {/* Badge de Destaque / Mais Popular */}
              {isDestacado && (
                <div className="absolute -top-2.5 right-4 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-[#B7F20B] text-black shadow-xs">
                  Mais Popular
                </div>
              )}

              <div className="space-y-4">
                {/* Cabeçalho do Plano */}
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="font-display font-bold text-base text-foreground">
                      {plan.nome}
                    </h4>
                    {isCurrent && (
                      <span className="px-2 py-0.5 text-[10px] font-semibold bg-foreground/10 text-foreground border border-foreground/20">
                        Plano Atual
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-muted-foreground block font-medium mt-0.5">
                    {plan.perfil_cliente}
                  </span>
                  <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                    {plan.descricao}
                  </p>
                </div>

                {/* Preço Mensal */}
                <div className="pt-2 border-t border-border">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-display font-bold text-foreground tracking-tight">
                      {formatMoney(plan.preco_mensal)}
                    </span>
                    <span className="text-xs text-muted-foreground">/mês</span>
                  </div>
                </div>

                {/* Limites Chave em Cards Compactos */}
                <div className="grid grid-cols-2 gap-2 text-xs py-1">
                  <div className="p-2 border border-border bg-background/50 text-center">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">CNPJs</span>
                    <strong className="text-foreground font-mono text-sm">{plan.cnpjs_inclusos} Médicos</strong>
                  </div>
                  <div className="p-2 border border-border bg-background/50 text-center">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Notas/mês</span>
                    <strong className="text-foreground font-mono text-sm">{plan.notas_mes_limite.toLocaleString("pt-BR")}</strong>
                  </div>
                </div>

                {/* Lista de Recursos / Benefícios */}
                <div className="space-y-2 pt-2 border-t border-border">
                  <span className="text-[11px] font-semibold text-foreground block">
                    O que está incluso:
                  </span>
                  <ul className="space-y-2 text-xs text-muted-foreground">
                    {plan.recursos.map((rec, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="h-3.5 w-3.5 text-[#B7F20B] shrink-0 mt-0.5" />
                        <span className="leading-snug text-foreground/90">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Botão de Ação */}
              <div className="pt-5 mt-4 border-t border-border">
                {isCurrent ? (
                  <Button
                    variant="outline"
                    disabled
                    className="w-full h-8 text-xs font-semibold rounded-none opacity-80 cursor-default"
                  >
                    Plano Ativo
                  </Button>
                ) : (
                  <Button
                    onClick={() => onSelectPlan(plan)}
                    className={`w-full h-8 text-xs font-semibold rounded-none gap-1.5 shadow-xs ${
                      isDestacado
                        ? "bg-[#B7F20B] hover:bg-[#B7F20B]/90 text-black"
                        : "bg-foreground text-background hover:bg-foreground/90"
                    }`}
                  >
                    <span>Contratar {plan.nome}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
