import { useState } from "react";
import { useSubscription } from "../hooks/useSubscription";
import type { Plan } from "../types";
import { SubscriptionUsageCard } from "./SubscriptionUsageCard";
import { PlanCardsGrid } from "./PlanCardsGrid";
import { InvoicesHistoryTable } from "./InvoicesHistoryTable";
import { UpgradePlanDialog } from "./UpgradePlanDialog";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";

export function BillingPage() {
  const {
    plans,
    subscription,
    invoices,
    quota,
    refetch,
  } = useSubscription();

  const [selectedPlanForUpgrade, setSelectedPlanForUpgrade] = useState<Plan | null>(null);

  const handleSelectPlan = (plan: Plan) => {
    setSelectedPlanForUpgrade(plan);
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden w-full bg-background font-sans">
      {/* ── Sub-Header com Ações ── */}
      <div className="border-b border-border bg-card/50 backdrop-blur-xs shrink-0 w-full">
        <div className="px-6 h-11 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
            <span className="text-foreground font-semibold">Organização</span>
            <span className="text-muted-foreground/40">/</span>
            <span>Planos de Assinatura & Cobrança</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                refetch();
                toast.success("Dados de assinatura atualizados.");
              }}
              className="h-7 text-xs rounded-none border-border hover:bg-accent font-medium gap-1.5"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Atualizar</span>
            </Button>
          </div>
        </div>
      </div>

      {/* ── Conteúdo Principal Scrollável ── */}
      <main className="flex-1 overflow-y-auto py-6 space-y-6 w-full px-6">
        {/* Cabeçalho */}
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl md:text-3xl font-display font-bold tracking-tight text-foreground">
            Planos & Gestão de Cobrança
          </h1>
          <p className="text-xs text-muted-foreground font-sans">
            Gerencie sua assinatura, limites de CNPJs de médicos, cotas de emissão de NFS-e mensais e histórico de faturas.
          </p>
        </div>

        {/* 1. Card de Consumo da Assinatura Atual */}
        <SubscriptionUsageCard
          subscription={subscription}
          quota={quota}
          onOpenUpgradeModal={() => {
            const nextPlan = plans.find((p) => p.id === "profissional") || plans[0];
            setSelectedPlanForUpgrade(nextPlan);
          }}
        />

        {/* 2. Grid de Planos Disponíveis */}
        <div className="pt-2">
          <PlanCardsGrid
            plans={plans}
            currentPlanId={(subscription?.plano_id || "") as any}
            onSelectPlan={handleSelectPlan}
          />
        </div>

        {/* 3. Tabela de Histórico de Faturas & Cobranças */}
        <div className="pt-2 pb-6">
          <InvoicesHistoryTable invoices={invoices} />
        </div>
      </main>

      {/* Modal de Upgrade / Contratação */}
      <UpgradePlanDialog
        plan={selectedPlanForUpgrade}
        open={Boolean(selectedPlanForUpgrade)}
        onOpenChange={(open) => !open && setSelectedPlanForUpgrade(null)}
      />
    </div>
  );
}
