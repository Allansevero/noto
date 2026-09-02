import { useState } from "react";
import type { VolumeDataPoint } from "../types";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Button } from "@/components/ui/button";

interface VolumeAndCostChartProps {
  data: VolumeDataPoint[];
  totalEmitidas: number;
  totalExtras: number;
}

export function VolumeAndCostChart({
  data,
  totalEmitidas,
  totalExtras,
}: VolumeAndCostChartProps) {
  const [timeRange, setTimeRange] = useState<"7d" | "30d">("7d");

  const custoFocusPorNota = 0.18;
  const custoManualEstimado = 4.20;
  const economiaTotal = ((custoManualEstimado - custoFocusPorNota) * totalEmitidas).toFixed(2);

  return (
    <div className="p-5 border border-border bg-card space-y-4">
      {/* Header do Gráfico */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display font-semibold text-sm text-foreground">
            Volume de Emissões Diárias
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Notas regulares vs reemissões por falha externa
          </p>
        </div>

        <div className="flex items-center gap-1 border border-border p-0.5 bg-muted/20">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTimeRange("7d")}
            className={`h-6 px-2 text-[11px] rounded-none ${
              timeRange === "7d"
                ? "bg-background text-foreground font-semibold"
                : "text-muted-foreground"
            }`}
          >
            7 dias
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTimeRange("30d")}
            className={`h-6 px-2 text-[11px] rounded-none ${
              timeRange === "30d"
                ? "bg-background text-foreground font-semibold"
                : "text-muted-foreground"
            }`}
          >
            30 dias
          </Button>
        </div>
      </div>

      {/* Gráfico de Barras Finas e Elegantes */}
      <div className="h-56 w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="label"
              stroke="#666666"
              fontSize={10}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#666666"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip
              cursor={{ fill: "rgba(255, 255, 255, 0.03)" }}
              contentStyle={{
                backgroundColor: "#111111",
                borderColor: "#2a2a2a",
                borderRadius: "0px",
                fontSize: "11px",
                color: "#FFFFFF",
                padding: "6px 10px",
              }}
              formatter={(value: any, name: any) => [
                `${value} notas`,
                name === "notasNormais" ? "Emissão Regular" : "Retrabalho / Extra",
              ]}
              labelFormatter={(label) => `Dia: ${label}`}
            />
            <Bar
              dataKey="notasNormais"
              name="notasNormais"
              fill="#B7F20B"
              barSize={8}
              radius={[1, 1, 0, 0]}
              stackId="a"
            />
            <Bar
              dataKey="notasExtras"
              name="notasExtras"
              fill="#F59E0B"
              barSize={8}
              radius={[1, 1, 0, 0]}
              stackId="a"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Resumo Limpo e em Linha */}
      <div className="flex flex-wrap items-center justify-between pt-3 border-t border-border text-xs gap-3">
        <div className="flex items-center gap-4 text-muted-foreground text-[11px]">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-none bg-[#B7F20B]" />
            Regulares ({totalEmitidas})
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-none bg-[#F59E0B]" />
            Extras ({totalExtras})
          </span>
        </div>

        <div className="text-[11px] text-muted-foreground">
          Economia Líquida: <strong className="text-[#B7F20B] font-mono">R$ {economiaTotal}</strong> (custo R$ 0,18/nota)
        </div>
      </div>
    </div>
  );
}
