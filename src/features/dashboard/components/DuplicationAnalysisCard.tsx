import type { DuplicationReason } from "../types";

interface DuplicationAnalysisCardProps {
  motivos: DuplicationReason[];
  totalExtras: number;
  taxaDuplicacao: number;
}

export function DuplicationAnalysisCard({
  motivos,
  taxaDuplicacao,
}: DuplicationAnalysisCardProps) {
  return (
    <div className="p-5 border border-border bg-card space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display font-semibold text-sm text-foreground">
            Motivos de Retrabalho
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Causas de reemissão no período
          </p>
        </div>

        <span className="text-xs font-mono font-medium text-amber-500">
          {taxaDuplicacao}% total
        </span>
      </div>

      {/* Lista Minimalista com Barras Finas */}
      <div className="space-y-3.5 pt-1">
        {motivos.map((item, idx) => (
          <div key={idx} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-foreground text-[11px] truncate max-w-[200px]" title={item.motivo}>
                {item.motivo}
              </span>
              <span className="font-mono text-muted-foreground text-[10px]">
                {item.quantidade}x ({item.percentual}%)
              </span>
            </div>

            {/* Barra de Progresso Fina */}
            <div className="w-full bg-muted/50 h-1 overflow-hidden">
              <div
                className="h-full transition-all duration-300"
                style={{
                  width: `${item.percentual}%`,
                  backgroundColor: item.cor,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
