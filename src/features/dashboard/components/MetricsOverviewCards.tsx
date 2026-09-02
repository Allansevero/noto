import type { DashboardSummary } from "../types";
import { ArrowUpRight } from "lucide-react";

interface MetricsOverviewCardsProps {
  summary: DashboardSummary;
}

export function MetricsOverviewCards({ summary }: MetricsOverviewCardsProps) {
  const { volumeTotal, volumeExtras, tempoEconomizado, slaQueue, saudeSistema } = summary;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
      {/* 1. Volume Total */}
      <div className="p-4 border border-border bg-card">
        <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
          Volume de Notas
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-3xl font-display font-bold text-foreground tracking-tight">
            {volumeTotal}
          </span>
          <span className="text-xs text-emerald-500 font-medium inline-flex items-center">
            <ArrowUpRight className="h-3 w-3 mr-0.5" /> +14%
          </span>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {volumeExtras} notas extras de retrabalho
        </p>
      </div>

      {/* 2. Tempo Economizado */}
      <div className="p-4 border border-border bg-card">
        <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
          Tempo Economizado
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-3xl font-display font-bold text-[#B7F20B] tracking-tight">
            {tempoEconomizado.horasEconomizadas}h
          </span>
          <span className="text-xs text-muted-foreground font-mono">
            (~{tempoEconomizado.diasUteisPoupados}d)
          </span>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          R$ {tempoEconomizado.valorEconomizadoEstimado.toLocaleString("pt-BR")} em horas poupadas
        </p>
      </div>

      {/* 3. SLA da API */}
      <div className="p-4 border border-border bg-card">
        <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
          Dentro do SLA (&lt;30s)
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-3xl font-display font-bold text-foreground tracking-tight">
            {slaQueue.percentualDentroDoSla}%
          </span>
          <span className="text-xs text-muted-foreground font-mono">
            {slaQueue.tempoMedioProcessamentoSegundos}s méd.
          </span>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {slaQueue.notasNaFilaTempoReal} notas na fila de envio agora
        </p>
      </div>

      {/* 4. Uptime & Saúde */}
      <div className="p-4 border border-border bg-card">
        <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
          Disponibilidade API
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-3xl font-display font-bold text-foreground tracking-tight">
            {saudeSistema.uptimePercent}%
          </span>
          <span className="h-2 w-2 rounded-full bg-[#B7F20B] animate-pulse" />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          0 quedas registradas no período
        </p>
      </div>
    </div>
  );
}
