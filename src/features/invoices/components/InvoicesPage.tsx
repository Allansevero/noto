import { useState, useMemo } from "react";
import { usePatients } from "@/features/patients/hooks/usePatients";
import { useDoctors } from "@/features/doctors/hooks/useDoctors";
import { formatCurrency } from "@/shared/utils";
import { StatusBadge } from "@/features/patients/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  FileText,
  Search,
  ExternalLink,
  Download,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  Copy,
  Receipt,
  FileCode,
  XCircle,
  Eye,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import type { Patient } from "@/features/patients/types";
import { cancelNfseFocus } from "@/features/patients/services/nfseEmission.service";

// Função para mascarar CPF
function maskCPF(cpf: string) {
  const digits = cpf ? cpf.replace(/\D/g, "") : "";
  if (digits.length !== 11) return cpf || "-";
  return `${digits.slice(0, 3)}.***.***-${digits.slice(9, 11)}`;
}

export function InvoicesPage() {
  const { allPatients, generateInvoice, refetch } = usePatients();
  const { allDoctors } = useDoctors();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("todos");
  const [isProcessingId, setIsProcessingId] = useState<string | null>(null);

  // Estados para modais de Visualização e Cancelamento
  const [viewInvoicePatient, setViewInvoicePatient] = useState<Patient | null>(null);
  const [cancelPatient, setCancelPatient] = useState<Patient | null>(null);
  const [cancelReason, setCancelReason] = useState("Cancelamento do atendimento médico");
  const [isCancelling, setIsCancelling] = useState(false);

  // Mapa de médicos por ID
  const doctorMap = useMemo(() => {
    const map = new Map();
    allDoctors.forEach((d) => map.set(d.id, d));
    return map;
  }, [allDoctors]);

  // Filtra as notas fiscais
  const invoicesList = useMemo(() => {
    return allPatients.filter((p) => {
      // Filtro de status
      if (statusFilter === "geradas" && p.status !== "Nota Gerada") return false;
      if (statusFilter === "processando" && p.status !== "Processando emissão") return false;
      if (statusFilter === "erro" && p.status !== "Erro na emissão") return false;
      if (statusFilter === "canceladas" && p.status !== "Nota Cancelada") return false;

      // Filtro de médico
      if (selectedDoctorId !== "todos" && p.medico_id !== selectedDoctorId) return false;

      // Filtro de busca
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const doc = p.medico_id ? doctorMap.get(p.medico_id) : null;
        const matchesPatient = p.nome_completo.toLowerCase().includes(query);
        const matchesCpf = p.cpf.includes(query);
        const matchesNfse = p.nfse_numero && p.nfse_numero.toLowerCase().includes(query);
        const matchesDoctor = doc && doc.nome_completo.toLowerCase().includes(query);
        return matchesPatient || matchesCpf || matchesNfse || matchesDoctor;
      }

      return true;
    });
  }, [allPatients, statusFilter, selectedDoctorId, searchQuery, doctorMap]);

  // Métricas
  const totalNotas = allPatients.filter((p) => p.status === "Nota Gerada" || p.status === "Processando emissão").length;
  const notasGeradasCount = allPatients.filter((p) => p.status === "Nota Gerada").length;
  const valorTotalFaturado = allPatients
    .filter((p) => p.status === "Nota Gerada")
    .reduce((acc, p) => acc + (p.valor_consulta || 0), 0);

  const handleEmitOrRetry = async (patientId: string) => {
    setIsProcessingId(patientId);
    try {
      await generateInvoice(patientId);
      toast.success("Solicitação de emissão enviada para a Focus NF-e!");
      refetch?.();
    } catch (err: any) {
      toast.error(err.message || "Erro ao emitir NFS-e.");
    } finally {
      setIsProcessingId(null);
    }
  };

  const handleDownloadFile = async (url: string, defaultFilename: string) => {
    try {
      toast.loading("Exportando arquivo...", { id: "export-file" });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Erro ao baixar arquivo do servidor");
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = defaultFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
      toast.success(`Arquivo ${defaultFilename} exportado com sucesso!`, { id: "export-file" });
    } catch {
      // Fallback cross-origin
      const a = document.createElement("a");
      a.href = url;
      a.setAttribute("download", defaultFilename);
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.dismiss("export-file");
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelPatient) return;
    setIsCancelling(true);
    try {
      await cancelNfseFocus(cancelPatient.id, cancelReason);
      toast.success(`NFS-e #${cancelPatient.nfse_numero || cancelPatient.id.slice(0, 6)} cancelada com sucesso.`);
      setCancelPatient(null);
      refetch?.();
    } catch (err: any) {
      toast.error(err.message || "Erro ao cancelar NFS-e.");
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden w-full bg-background font-sans">
      {/* ── Sub-Header com Ações ── */}
      <div className="border-b border-border bg-card/50 backdrop-blur-xs shrink-0 w-full">
        <div className="px-6 h-11 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
            <span className="text-foreground font-semibold">Organização</span>
            <span className="text-muted-foreground/40">/</span>
            <span>Central de Notas Fiscais (NFS-e)</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                refetch?.();
                toast.success("Lista de notas fiscais atualizada.");
              }}
              className="h-7 text-xs rounded-none border-border hover:bg-accent font-medium gap-1.5"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Atualizar</span>
            </Button>
          </div>
        </div>
      </div>

      {/* ── Conteúdo Principal ── */}
      <main className="flex-1 overflow-y-auto py-5 space-y-5 w-full">
        {/* Cabeçalho */}
        <div className="px-6 flex flex-col gap-1">
          <h1 className="text-2xl md:text-3xl font-display font-bold tracking-tight text-foreground">
            Central de Notas Fiscais
          </h1>
          <p className="text-xs text-muted-foreground font-sans">
            Visualize os detalhes da NFS-e, faça o download do DANFSe (PDF) ou XML assinado e realize cancelamentos quando necessário.
          </p>
        </div>

        {/* Grid de Métricas de Faturamento */}
        <div className="px-6 grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
          <div className="p-3.5 rounded-none border border-border bg-card shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground font-display">Total Faturado</span>
              <Receipt className="h-3.5 w-3.5 text-[#B7F20B]" />
            </div>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="text-2xl font-display font-bold text-[#B7F20B] tracking-tight">
                {formatCurrency(valorTotalFaturado)}
              </span>
            </div>
            <span className="text-[11px] text-muted-foreground block mt-1">em notas geradas com sucesso</span>
          </div>

          <div className="p-3.5 rounded-none border border-border bg-card shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground font-display">Notas Autorizadas</span>
              <CheckCircle2 className="h-3.5 w-3.5 text-[#B7F20B]" />
            </div>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="text-2xl font-display font-semibold text-foreground tracking-tight">
                {notasGeradasCount}
              </span>
              <span className="text-[11px] text-muted-foreground">de {totalNotas} emitidas</span>
            </div>
            <span className="text-[11px] text-muted-foreground block mt-1">100% integradas à Focus NF-e</span>
          </div>

          <div className="p-3.5 rounded-none border border-border bg-card shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground font-display">Ambiente Ativo</span>
              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="text-xl font-display font-semibold text-foreground tracking-tight">
                Homologação / Produção
              </span>
            </div>
            <span className="text-[11px] text-muted-foreground block mt-1">Porto Alegre & Capitais</span>
          </div>
        </div>

        {/* Barra de Filtros */}
        <div className="px-6 flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
          <div className="flex flex-1 items-center gap-2 w-full sm:w-auto">
            {/* Input de Busca */}
            <div className="relative flex-1 sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar por paciente, CPF, número ou médico..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-9 text-xs rounded-none bg-background"
              />
            </div>

            {/* Filtro por Médico */}
            <Select value={selectedDoctorId} onValueChange={setSelectedDoctorId}>
              <SelectTrigger className="h-8 text-xs rounded-none bg-background w-48">
                <SelectValue placeholder="Todos os Médicos" />
              </SelectTrigger>
              <SelectContent className="rounded-none">
                <SelectItem value="todos">Todos os Médicos</SelectItem>
                {allDoctors.map((doc) => (
                  <SelectItem key={doc.id} value={doc.id} className="text-xs">
                    Dr(a). {doc.nome_completo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Filtro por Status */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 text-xs rounded-none bg-background w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="rounded-none">
                <SelectItem value="todos">Todos os Status</SelectItem>
                <SelectItem value="geradas">Nota Gerada</SelectItem>
                <SelectItem value="processando">Processando</SelectItem>
                <SelectItem value="canceladas">Canceladas</SelectItem>
                <SelectItem value="erro">Com Erro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tabela de Notas Fiscais 100% Full-Width */}
        <div className="w-full border-y border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="h-9 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider pl-6">
                  NFS-e / Número
                </TableHead>
                <TableHead className="h-9 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Paciente (Tomador)
                </TableHead>
                <TableHead className="h-9 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Médico (Prestador)
                </TableHead>
                <TableHead className="h-9 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider text-right">
                  Valor
                </TableHead>
                <TableHead className="h-9 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider text-center">
                  Data
                </TableHead>
                <TableHead className="h-9 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider text-center">
                  Status
                </TableHead>
                <TableHead className="h-9 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider text-right pr-6">
                  Ações & Documentos
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoicesList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-xs text-muted-foreground">
                    Nenhuma nota fiscal encontrada para os filtros selecionados.
                  </TableCell>
                </TableRow>
              ) : (
                invoicesList.map((item) => {
                  const doctor = item.medico_id ? doctorMap.get(item.medico_id) : null;
                  const dataStr = item.data_nota_gerada || item.nfse_data_emissao || item.data_criacao;
                  const dataFormatted = dataStr
                    ? new Date(dataStr).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "-";

                  return (
                    <TableRow key={item.id} className="border-border hover:bg-muted/30">
                      {/* Número da NFS-e */}
                      <TableCell className="pl-6 py-2.5 font-mono text-xs whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-[#B7F20B] px-1.5 py-0.5 bg-[#B7F20B]/10 border border-[#B7F20B]/20">
                            {item.nfse_numero ? `#${item.nfse_numero}` : `#${item.id.slice(0, 6)}`}
                          </span>
                        </div>
                      </TableCell>

                      {/* Paciente */}
                      <TableCell className="py-2.5 whitespace-nowrap">
                        <div>
                          <span className="font-semibold text-xs text-foreground block">
                            {item.nome_completo}
                          </span>
                          <span className="text-[11px] text-muted-foreground font-mono">
                            CPF: {maskCPF(item.cpf)}
                          </span>
                        </div>
                      </TableCell>

                      {/* Médico */}
                      <TableCell className="py-2.5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {doctor?.foto_perfil ? (
                            <img
                              src={doctor.foto_perfil}
                              alt={doctor.nome_completo}
                              className="h-6 w-6 rounded-full object-cover shrink-0 border border-border"
                              style={{ borderRadius: "100%" }}
                            />
                          ) : (
                            <div
                              className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[9px] font-bold shrink-0"
                              style={{ borderRadius: "100%" }}
                            >
                              {doctor?.nome_completo ? doctor.nome_completo.slice(0, 2).toUpperCase() : "DR"}
                            </div>
                          )}
                          <div>
                            <span className="font-medium text-xs text-foreground block">
                              Dr(a). {doctor?.nome_completo || "Não vinculado"}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              CRM: {doctor?.crm || "ISENTO"}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      {/* Valor */}
                      <TableCell className="text-right py-2.5 whitespace-nowrap font-mono text-xs font-semibold text-foreground">
                        {formatCurrency(item.valor_consulta)}
                      </TableCell>

                      {/* Data */}
                      <TableCell className="text-center py-2.5 whitespace-nowrap text-xs text-muted-foreground font-mono">
                        {dataFormatted}
                      </TableCell>

                      {/* Status */}
                      <TableCell className="text-center py-2.5 whitespace-nowrap">
                        <StatusBadge status={item.status} />
                      </TableCell>

                      {/* Ações / Documentos Exclusivos da Área de Notas */}
                      <TableCell className="text-right pr-6 py-2.5 whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* 1. Ver Detalhes */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewInvoicePatient(item)}
                            className="h-7 px-2 text-xs rounded-none text-muted-foreground hover:text-foreground gap-1"
                            title="Ver detalhes da NFS-e"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span className="hidden md:inline">Detalhes</span>
                          </Button>

                          {/* 2. Baixar DANFSe PDF */}
                          {item.nfse_pdf_url && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleDownloadFile(
                                  item.nfse_pdf_url!,
                                  `DANFSe_NF_${item.nfse_numero || item.id.slice(0, 6)}_${item.nome_completo.replace(/\s+/g, "_")}.pdf`
                                )
                              }
                              className="h-7 text-xs rounded-none gap-1 bg-[#B7F20B]/10 hover:bg-[#B7F20B]/20 text-foreground border-[#B7F20B]/40 font-medium cursor-pointer"
                            >
                              <Download className="h-3 w-3 text-[#B7F20B]" />
                              <span>Baixar PDF</span>
                            </Button>
                          )}

                          {/* 3. Baixar XML */}
                          {item.nfse_xml_url && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleDownloadFile(
                                  item.nfse_xml_url!,
                                  `NFSe_${item.nfse_numero || item.id.slice(0, 6)}.xml`
                                )
                              }
                              className="h-7 text-xs rounded-none gap-1 border-border text-muted-foreground hover:text-foreground cursor-pointer"
                            >
                              <Download className="h-3 w-3" />
                              <span>XML</span>
                            </Button>
                          )}

                          {/* 4. Cancelar Nota (quando gerada) */}
                          {item.status === "Nota Gerada" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setCancelPatient(item)}
                              className="h-7 px-2 text-xs rounded-none text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 gap-1"
                              title="Cancelar NFS-e na prefeitura"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                              <span className="hidden md:inline">Cancelar</span>
                            </Button>
                          )}

                          {/* 5. Processando */}
                          {item.status === "Processando emissão" && (
                            <span className="text-[11px] text-amber-500 flex items-center gap-1 font-mono">
                              <Clock className="h-3 w-3 animate-spin" />
                              <span>Processando</span>
                            </span>
                          )}

                          {/* 6. Erro / Reemissão */}
                          {item.status === "Erro na emissão" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEmitOrRetry(item.id)}
                              disabled={isProcessingId === item.id}
                              className="h-7 text-xs rounded-none gap-1 bg-red-500/10 text-red-600 border-red-500/30 font-medium"
                            >
                              <RefreshCw className={`h-3 w-3 ${isProcessingId === item.id ? "animate-spin" : ""}`} />
                              <span>Tentar Novamente</span>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </main>

      {/* ── Dialog de Visualização Detalhada da NFS-e ── */}
      <Dialog open={Boolean(viewInvoicePatient)} onOpenChange={(open) => !open && setViewInvoicePatient(null)}>
        <DialogContent className="rounded-none sm:max-w-[540px] p-6 space-y-4">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-base font-display font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4 text-[#B7F20B]" />
              Detalhes da Nota Fiscal de Serviço (NFS-e)
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Informações fiscais e cadastrais registradas para este atendimento.
            </DialogDescription>
          </DialogHeader>

          {viewInvoicePatient && (
            <div className="space-y-3 text-xs">
              <div className="bg-muted/40 p-3.5 border border-border grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-muted-foreground block">Número da NFS-e:</span>
                  <strong className="text-foreground font-mono text-sm text-[#B7F20B]">
                    {viewInvoicePatient.nfse_numero ? `#${viewInvoicePatient.nfse_numero}` : "Em homologação / processando"}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">Valor do Atendimento:</span>
                  <strong className="text-foreground font-mono text-sm">
                    {formatCurrency(viewInvoicePatient.valor_consulta)}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">Paciente (Tomador):</span>
                  <span className="text-foreground font-semibold block truncate">{viewInvoicePatient.nome_completo}</span>
                  <span className="text-[10px] font-mono text-muted-foreground">CPF: {viewInvoicePatient.cpf}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">Médico Responsável:</span>
                  <span className="text-foreground font-semibold block truncate">
                    Dr(a). {doctorMap.get(viewInvoicePatient.medico_id || "")?.nome_completo || "Prestador"}
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    CNPJ: {doctorMap.get(viewInvoicePatient.medico_id || "")?.cnpj || "-"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">Código Tributação Nacional:</span>
                  <span className="text-foreground font-mono">04.16.01 (Serviços Médicos / Psiquiatria)</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">Alíquota ISS Aplicada:</span>
                  <span className="text-foreground font-mono">2,00% (Não Retido)</span>
                </div>
              </div>

              {viewInvoicePatient.nfse_erro_motivo && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300 space-y-1">
                  <span className="font-semibold block">Mensagem do Processamento:</span>
                  <p className="font-mono text-[11px] whitespace-pre-wrap">{viewInvoicePatient.nfse_erro_motivo}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="pt-3 border-t border-border flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={() => setViewInvoicePatient(null)} className="h-8 text-xs rounded-none">
              Fechar
            </Button>
            <div className="flex items-center gap-2">
              {viewInvoicePatient?.nfse_xml_url && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handleDownloadFile(
                      viewInvoicePatient.nfse_xml_url!,
                      `NFSe_${viewInvoicePatient.nfse_numero || viewInvoicePatient.id.slice(0, 6)}.xml`
                    )
                  }
                  className="h-8 text-xs rounded-none gap-1 cursor-pointer"
                >
                  <Download className="h-3 w-3" />
                  <span>Baixar XML</span>
                </Button>
              )}
              {viewInvoicePatient?.nfse_pdf_url && (
                <Button
                  size="sm"
                  onClick={() =>
                    handleDownloadFile(
                      viewInvoicePatient.nfse_pdf_url!,
                      `DANFSe_NF_${viewInvoicePatient.nfse_numero || viewInvoicePatient.id.slice(0, 6)}_${viewInvoicePatient.nome_completo.replace(/\s+/g, "_")}.pdf`
                    )
                  }
                  className="h-8 text-xs rounded-none font-semibold bg-[#B7F20B] hover:bg-[#B7F20B]/90 text-black gap-1 cursor-pointer"
                >
                  <Download className="h-3 w-3" />
                  <span>Baixar PDF</span>
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── AlertDialog de Cancelamento de NFS-e ── */}
      <AlertDialog open={Boolean(cancelPatient)} onOpenChange={(open) => !open && setCancelPatient(null)}>
        <AlertDialogContent className="rounded-none sm:max-w-[480px]">
          <AlertDialogHeader className="space-y-1">
            <AlertDialogTitle className="text-base font-semibold text-red-600 flex items-center gap-2">
              <XCircle className="h-5 w-5" />
              Cancelar Nota Fiscal de Serviço (NFS-e)
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground space-y-3 pt-2">
              <p>
                Tem certeza de que deseja solicitar o cancelamento da NFS-e{" "}
                <strong className="text-foreground">
                  {cancelPatient?.nfse_numero ? `#${cancelPatient.nfse_numero}` : `#${cancelPatient?.id.slice(0, 6)}`}
                </strong>{" "}
                emitida para <strong className="text-foreground">{cancelPatient?.nome_completo}</strong> no valor de{" "}
                <strong className="text-foreground">{formatCurrency(cancelPatient?.valor_consulta || 0)}</strong>?
              </p>

              <div className="space-y-1 text-left">
                <label className="text-xs font-medium text-foreground block">
                  Justificativa do cancelamento na prefeitura: *
                </label>
                <Input
                  type="text"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="h-8 text-xs rounded-none"
                  placeholder="Ex: Cancelamento de consulta médica"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-3 border-t">
            <AlertDialogCancel disabled={isCancelling} className="h-8 text-xs rounded-none">
              Voltar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmCancel}
              disabled={isCancelling || !cancelReason.trim()}
              className="h-8 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-none gap-1.5"
            >
              {isCancelling ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Cancelando...</span>
                </>
              ) : (
                <>
                  <XCircle className="h-3.5 w-3.5" />
                  <span>Confirmar Cancelamento</span>
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
