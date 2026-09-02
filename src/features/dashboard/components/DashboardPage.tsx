import {
  BarChart3,
  Clock,
  CheckCircle2,
  Layers,
  ShieldCheck,
  Activity,
  Receipt,
  FileText,
} from "lucide-react";

interface DashboardPageProps {
  onNavigateToPatients?: () => void;
  onNavigateToDoctors?: () => void;
}

export function DashboardPage(_props: DashboardPageProps) {
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
              Economia operacional automatizada
            </p>
          </div>

          {/* Card 4: Taxa de Emissão */}
          <div className="p-4 border border-border bg-card relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                Taxa de Sucesso
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
              NFS-e autorizadas sem rejeição
            </p>
          </div>
        </div>

        {/* 2. Grid de Análises Secundárias */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card Volume Histórico */}
          <div className="lg:col-span-2 p-5 border border-border bg-card relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-display font-semibold text-sm text-foreground">
                  Evolução Temporal de Emissões
                </h3>
              </div>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-semibold">
                Em Breve
              </span>
            </div>
            <div className="h-48 flex items-center justify-center text-xs text-muted-foreground">
              Gráficos de volumetria e série temporal em processamento analítico.
            </div>
          </div>

          {/* Card SLA e Filas */}
          <div className="p-5 border border-border bg-card relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-display font-semibold text-sm text-foreground">
                  Monitor de Filas & SLA
                </h3>
              </div>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-semibold">
                Em Breve
              </span>
            </div>
            <div className="h-48 flex flex-col items-center justify-center text-xs text-muted-foreground text-center gap-2">
              <Activity className="h-8 w-8 text-muted-foreground/40" />
              <span>Tempo médio de autorização e monitoramento de retornos das prefeituras.</span>
            </div>
          </div>
        </div>

        {/* 3. Resumo de Retenção e Conformidade Fiscal */}
        <div className="p-5 border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#B7F20B]" />
              <h3 className="font-display font-semibold text-sm text-foreground">
                Conformidade e Retenção Fiscal (90 Dias)
              </h3>
            </div>
            <span className="text-[10px] font-mono text-[#B7F20B] border border-[#B7F20B]/30 bg-[#B7F20B]/10 px-2 py-0.5 font-semibold">
              Ativo
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
            Todas as notas fiscais emitidas têm retenção e custódia segura de XMLs e PDFs no banco de dados com histórico completo e rastreabilidade jurídica.
          </p>
        </div>
      </main>
    </div>
  );
}
