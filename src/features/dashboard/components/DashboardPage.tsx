import { Button } from "@/components/ui/button";
import {
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle2,
  Sparkles,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Activity,
  Receipt,
  FileText,
} from "lucide-react";

interface DashboardPageProps {
  onNavigateToPatients?: () => void;
  onNavigateToDoctors?: () => void;
}

export function DashboardPage({
  onNavigateToPatients,
  onNavigateToDoctors,
}: DashboardPageProps) {
  return (
    <div className="flex flex-1 flex-col overflow-hidden w-full bg-background font-sans">
      {/* ── Barra de Sub-Header ── */}
      <div className="border-b border-border bg-card/50 backdrop-blur-xs shrink-0 w-full">
        <div className="px-6 h-11 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
            <span className="text-foreground font-semibold">Organização</span>
            <span className="text-muted-foreground/40">/</span>
            <span>Dashboard & Indicadores</span>
          </div>

          <div className="flex items-center gap-2">
            <span
              className="px-2.5 py-0.5 text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30"
              style={{ borderRadius: "100px" }}
            >
              Em breve
            </span>
          </div>
        </div>
      </div>

      {/* ── Conteúdo Principal do Dashboard ── */}
      <main className="flex-1 overflow-y-auto py-6 space-y-6 w-full px-6">

        {/* 1. KPIs Principais (Estado: Em Breve) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
          {/* Card 1: Volume Total */}
          <div className="p-4 border border-border bg-card relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Volume de Notas
              </span>
              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-display font-bold text-muted-foreground/60 tracking-tight">
                --
              </span>
              <span
                className="px-1.5 py-0.2 text-[9px] font-mono font-medium text-amber-500 bg-amber-500/10 border border-amber-500/20"
                style={{ borderRadius: "100px" }}
              >
                Em breve
              </span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Total de NFS-e emitidas e consolidadas
            </p>
          </div>

          {/* Card 2: Total Faturado */}
          <div className="p-4 border border-border bg-card relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Faturamento Total
              </span>
              <Receipt className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-display font-bold text-muted-foreground/60 tracking-tight">
                R$ --
              </span>
              <span
                className="px-1.5 py-0.2 text-[9px] font-mono font-medium text-amber-500 bg-amber-500/10 border border-amber-500/20"
                style={{ borderRadius: "100px" }}
              >
                Em breve
              </span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Receita bruta autorizada no período
            </p>
          </div>

          {/* Card 3: Tempo Economizado */}
          <div className="p-4 border border-border bg-card relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Tempo Economizado
              </span>
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-display font-bold text-muted-foreground/60 tracking-tight">
                -- h
              </span>
              <span
                className="px-1.5 py-0.2 text-[9px] font-mono font-medium text-amber-500 bg-amber-500/10 border border-amber-500/20"
                style={{ borderRadius: "100px" }}
              >
                Em breve
              </span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Horas operacionais poupadas com automação
            </p>
          </div>

          {/* Card 4: Taxa de Sucesso SLA */}
          <div className="p-4 border border-border bg-card relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Taxa de Autorização
              </span>
              <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-display font-bold text-muted-foreground/60 tracking-tight">
                -- %
              </span>
              <span
                className="px-1.5 py-0.2 text-[9px] font-mono font-medium text-amber-500 bg-amber-500/10 border border-amber-500/20"
                style={{ borderRadius: "100px" }}
              >
                Em breve
              </span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              NFS-e autorizadas sem pendências
            </p>
          </div>
        </div>

        {/* 2. Seções Visuais / Gráficos com Placeholder "Em Breve" */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 w-full">
          {/* Gráfico de Volume Histórico */}
          <div className="lg:col-span-2 p-5 border border-border bg-card flex flex-col justify-between min-h-[260px]">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-display font-semibold text-foreground">
                  Evolução de Emissões & Faturamento
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Comparativo mensal de consultas e notas fiscais emitidas
                </p>
              </div>
              <span
                className="px-2 py-0.5 text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                style={{ borderRadius: "100px" }}
              >
                Em breve
              </span>
            </div>

            {/* Placeholder Gráfico em Linhas Tracejadas */}
            <div className="my-6 h-36 border border-dashed border-border/80 bg-muted/10 flex flex-col items-center justify-center text-center gap-2 p-4">
              <BarChart3 className="h-7 w-7 text-muted-foreground/50" />
              <span className="text-xs font-medium text-muted-foreground">
                Gráficos analíticos e comparativos em desenvolvimento
              </span>
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/60">
              <span>Projeção de fechamento fiscal mensal</span>
              <span className="font-mono text-[11px]">Módulo Noto Analytics</span>
            </div>
          </div>

          {/* Diagnóstico & Inteligência Fiscal */}
          <div className="lg:col-span-1 p-5 border border-border bg-card flex flex-col justify-between min-h-[260px]">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-display font-semibold text-foreground">
                  Auditoria Tributária
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Prevenção de duplicidade e erros fiscais
                </p>
              </div>
              <span
                className="px-2 py-0.5 text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                style={{ borderRadius: "100px" }}
              >
                Em breve
              </span>
            </div>

            <div className="my-6 h-36 border border-dashed border-border/80 bg-muted/10 flex flex-col items-center justify-center text-center gap-2 p-4">
              <ShieldCheck className="h-7 w-7 text-muted-foreground/50" />
              <span className="text-xs font-medium text-muted-foreground">
                Algoritmos de conciliação fiscal e alertas automáticos
              </span>
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/60">
              <span>Taxa de conformidade</span>
              <span className="font-mono text-[11px]">100% compliant</span>
            </div>
          </div>
        </div>

        {/* 3. SLA da API e Fila em Tempo Real */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full pb-6">
          <div className="p-5 border border-border bg-card flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-display font-semibold text-foreground">
                  Tempo de Resposta das Prefeituras (SLA)
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Monitoramento em tempo real do tempo de autorização por município
                </p>
              </div>
              <span
                className="px-2 py-0.5 text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                style={{ borderRadius: "100px" }}
              >
                Em breve
              </span>
            </div>

            <div className="my-6 h-28 border border-dashed border-border/80 bg-muted/10 flex flex-col items-center justify-center text-center gap-2 p-4">
              <Activity className="h-6 w-6 text-muted-foreground/50" />
              <span className="text-xs text-muted-foreground">
                Métricas de latência e disponibilidade dos webservices municipais
              </span>
            </div>

            <div className="text-xs text-muted-foreground pt-2 border-t border-border/60 flex justify-between">
              <span>Status geral dos provedores</span>
              <span className="text-emerald-500 font-medium">99.9% Operacional</span>
            </div>
          </div>

          <div className="p-5 border border-border bg-card flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-display font-semibold text-foreground">
                  Exportação de Relatórios Fiscais
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Geração automática de relatórios em CSV/Excel para sua contabilidade
                </p>
              </div>
              <span
                className="px-2 py-0.5 text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                style={{ borderRadius: "100px" }}
              >
                Em breve
              </span>
            </div>

            <div className="my-6 h-28 border border-dashed border-border/80 bg-muted/10 flex flex-col items-center justify-center text-center gap-2 p-4">
              <Layers className="h-6 w-6 text-muted-foreground/50" />
              <span className="text-xs text-muted-foreground">
                Fechamento mensal consolidado com 1 clique para o contador
              </span>
            </div>

            <div className="text-xs text-muted-foreground pt-2 border-t border-border/60 flex justify-between">
              <span>Formatos suportados</span>
              <span className="font-mono text-[11px]">CSV, XLSX, XML Zip</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
