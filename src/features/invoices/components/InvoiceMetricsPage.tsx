import { useMemo } from "react";
import { usePatients } from "@/features/patients/hooks/usePatients";
import { useDoctors } from "@/features/doctors/hooks/useDoctors";
import { formatCurrency } from "@/shared/utils";
import {
  Receipt,
  TrendingUp,
  Percent,
  CheckCircle2,
  Stethoscope,
} from "lucide-react";

export function InvoiceMetricsPage() {
  const { allPatients } = usePatients();
  const { allDoctors } = useDoctors();

  const metrics = useMemo(() => {
    const issuedNotes = allPatients.filter(
      (p) => p.status === "Nota Gerada" || p.status === "Aprovado"
    );

    const totalFaturadoCentavos = issuedNotes.reduce(
      (acc, curr) => acc + (curr.valor_consulta || 0),
      0
    );

    // Média de alíquota ISS ~2% a 5%
    const issEstimado = (totalFaturadoCentavos / 100) * 0.02;

    const totalEmitidas = allPatients.filter((p) => p.status === "Nota Gerada").length;
    const taxaSucesso =
      allPatients.length > 0
        ? Math.round((issuedNotes.length / allPatients.length) * 100)
        : 100;

    return {
      totalEmitidas,
      totalFaturado: totalFaturadoCentavos / 100,
      issEstimado,
      taxaSucesso,
    };
  }, [allPatients]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden w-full bg-background font-sans">
      {/* Sub-Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-xs shrink-0 w-full">
        <div className="px-6 h-11 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
            <span className="text-foreground font-semibold">Notas Fiscais</span>
            <span className="text-muted-foreground/40">/</span>
            <span>Métricas & Indicadores Fiscais</span>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <main className="flex-1 overflow-y-auto py-6 space-y-6 w-full px-6 max-w-6xl">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl md:text-3xl font-display font-bold tracking-tight text-foreground">
            Métricas de Faturamento & Emissões
          </h1>
          <p className="text-sm text-muted-foreground">
            Acompanhe o volume faturado, arrecadação de tributos e desempenho de autorização junto às prefeituras.
          </p>
        </div>

        {/* Grid de Cards Métricas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-none border border-border bg-card shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground font-display">NFS-e Emitidas</span>
              <Receipt className="h-4 w-4 text-[#B7F20B]" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-display font-semibold text-foreground tracking-tight">
                {metrics.totalEmitidas}
              </span>
              <span className="text-[11px] text-muted-foreground">documentos</span>
            </div>
          </div>

          <div className="p-4 rounded-none border border-border bg-card shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground font-display">Total Faturado</span>
              <TrendingUp className="h-4 w-4 text-[#B7F20B]" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-display font-semibold text-[#B7F20B] tracking-tight">
                {formatCurrency(metrics.totalFaturado * 100)}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-none border border-border bg-card shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground font-display">ISS Estimado (2%)</span>
              <Percent className="h-4 w-4 text-amber-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-display font-semibold text-amber-600 dark:text-amber-400 tracking-tight">
                {formatCurrency(metrics.issEstimado * 100)}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-none border border-border bg-card shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground font-display">Taxa de Aprovação</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-display font-semibold text-foreground tracking-tight">
                {metrics.taxaSucesso}%
              </span>
              <span className="text-[11px] text-muted-foreground">autorizadas</span>
            </div>
          </div>
        </div>

        {/* Detalhamento por Médico */}
        <div className="p-5 border border-border bg-card rounded-none space-y-4">
          <div className="flex items-center gap-2 border-b border-border/60 pb-3">
            <Stethoscope className="h-4 w-4 text-[#B7F20B]" />
            <h3 className="font-display font-semibold text-sm text-foreground">Faturamento por Médico Titular</h3>
          </div>

          <div className="space-y-3">
            {allDoctors.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">
                Nenhum médico cadastrado no momento.
              </p>
            ) : (
              allDoctors.map((doc) => {
                const docPatients = allPatients.filter((p) => p.medico_id === doc.id);
                const docTotal = docPatients.reduce((acc, curr) => acc + (curr.valor_consulta || 0), 0);

                return (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 border border-border/60 bg-muted/20"
                  >
                    <div className="flex items-center gap-3">
                      {doc.foto_perfil ? (
                        <img
                          src={doc.foto_perfil}
                          alt={doc.nome_completo}
                          className="h-7 w-7 rounded-full object-cover border border-border"
                        />
                      ) : (
                        <div className="h-7 w-7 rounded-full bg-muted border border-border text-xs font-bold flex items-center justify-center text-foreground">
                          {doc.nome_completo.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <strong className="text-xs text-foreground block">{doc.nome_completo}</strong>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          CNPJ: {doc.cnpj || "Sem CNPJ"} &bull; CRM: {doc.crm || "ISENTO"}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-foreground block">
                        {formatCurrency(docTotal)}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {docPatients.length} consultas
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
