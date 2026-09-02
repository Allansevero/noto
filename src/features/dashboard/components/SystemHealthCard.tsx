import type { SystemHealthMetrics } from "../types";
import { CheckCircle2 } from "lucide-react";

interface SystemHealthCardProps {
  health: SystemHealthMetrics;
}

export function SystemHealthCard({ health }: SystemHealthCardProps) {
  return (
    <div className="p-5 border border-border bg-card space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display font-semibold text-sm text-foreground">
            Saúde & Conectividade
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Status operacional e integridade das conexões
          </p>
        </div>

        <span className="text-[11px] font-mono text-[#B7F20B] px-2 py-0.5 bg-[#B7F20B]/10 border border-[#B7F20B]/20">
          {health.uptimePercent}% Uptime
        </span>
      </div>

      {/* Grid de 3 Métricas Diretas */}
      <div className="grid grid-cols-3 gap-3 pt-1">
        <div className="space-y-1">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">
            API Focus NF-e
          </span>
          <span className="text-sm font-semibold text-foreground flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-[#B7F20B]" />
            Operacional
          </span>
          <span className="text-[10px] text-muted-foreground block">HTTPS Basic Auth</span>
        </div>

        <div className="space-y-1 border-l border-border pl-3">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">
            Prefeituras
          </span>
          <span className="text-sm font-semibold text-foreground flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-[#B7F20B]" />
            Estável
          </span>
          <span className="text-[10px] text-muted-foreground block">WebServices ativos</span>
        </div>

        <div className="space-y-1 border-l border-border pl-3">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">
            Quedas / Travamentos
          </span>
          <span className="text-xl font-display font-bold text-foreground font-mono">
            {health.notasTravadasQueda}
          </span>
          <span className="text-[10px] text-muted-foreground block">{health.taxaSucessoPrimeiraTentativa}% no 1º envio</span>
        </div>
      </div>
    </div>
  );
}
