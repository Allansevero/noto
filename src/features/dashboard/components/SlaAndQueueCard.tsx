import type { SlaQueueMetrics } from "../types";

interface SlaAndQueueCardProps {
  metrics: SlaQueueMetrics;
}

export function SlaAndQueueCard({ metrics }: SlaAndQueueCardProps) {
  return (
    <div className="p-5 border border-border bg-card space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display font-semibold text-sm text-foreground">
            Fila & SLA de Processamento
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Tempo de resposta da Focus NF-e até autorização
          </p>
        </div>

        <span className="text-[11px] font-mono text-[#B7F20B] px-2 py-0.5 bg-[#B7F20B]/10 border border-[#B7F20B]/20">
          SLA Ativo
        </span>
      </div>

      {/* Grid de 3 Métricas Diretas */}
      <div className="grid grid-cols-3 gap-3 pt-1">
        <div className="space-y-1">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">
            Fila Agora
          </span>
          <span className="text-xl font-display font-bold text-foreground">
            {metrics.notasNaFilaTempoReal}
          </span>
          <span className="text-[10px] text-muted-foreground block">aguardando</span>
        </div>

        <div className="space-y-1 border-l border-border pl-3">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">
            Latência Média
          </span>
          <span className="text-xl font-display font-bold text-foreground font-mono">
            {metrics.tempoMedioProcessamentoSegundos}s
          </span>
          <span className="text-[10px] text-muted-foreground block">API: {metrics.tempoMedioChamadaApiMs}ms</span>
        </div>

        <div className="space-y-1 border-l border-border pl-3">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">
            No SLA (&lt;30s)
          </span>
          <span className="text-xl font-display font-bold text-[#B7F20B] font-mono">
            {metrics.percentualDentroDoSla}%
          </span>
          <span className="text-[10px] text-muted-foreground block">0.6% atrasos</span>
        </div>
      </div>
    </div>
  );
}
