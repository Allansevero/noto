import { useState, useMemo } from "react";
import { usePatients } from "../hooks/usePatients";
import { useDoctors } from "@/features/doctors/hooks/useDoctors";
import { useSubscription } from "@/features/billing/hooks/useSubscription";
import { formatCurrency } from "@/shared/utils";
import { PatientActions } from "./PatientActions";
import { PatientFormDialog } from "./PatientFormDialog";
import { ImportPatientsCsvDialog } from "./ImportPatientsCsvDialog";
import {
  SubscriptionRequiredDialog,
  type BlockedActionType,
} from "@/features/billing/components/SubscriptionRequiredDialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  Search,
  UserPlus,
  FileSpreadsheet,
  FileCheck,
  X,
  Stethoscope,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import type { Patient } from "../types";

// Função para mascarar CPF na UI (Ex: 123.***.***-00)
function maskCPF(cpf: string) {
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11) return cpf;
  return `${digits.slice(0, 3)}.***.***-${digits.slice(9, 11)}`;
}

// ID do médico ativo padrão
const DEFAULT_MEDICO_ID = "00000000-0000-0000-0000-000000000001";

interface PatientsTableProps {
  patientState?: ReturnType<typeof usePatients>;
}

export function PatientsTable({ patientState }: PatientsTableProps) {
  const defaultState = usePatients();
  const {
    patients,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    approvePayment,
    generateInvoice,
    addPatient,
  } = patientState || defaultState;

  const { allDoctors } = useDoctors();
  const { hasActiveSubscription } = useSubscription();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCsvImportOpen, setIsCsvImportOpen] = useState(false);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);

  // Controle de Trava de Assinatura (Paywall)
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [blockedAction, setBlockedAction] = useState<BlockedActionType>("general");

  const triggerPaywall = (action: BlockedActionType) => {
    setBlockedAction(action);
    setPaywallOpen(true);
  };

  // Filtragem combinada por Médico Selecionado
  const displayedPatients = useMemo(() => {
    return patients.filter((patient) => {
      if (selectedDoctorId && selectedDoctorId !== "all") {
        if (patient.medico_id !== selectedDoctorId) return false;
      }
      return true;
    });
  }, [patients, selectedDoctorId]);

  const isAllSelected =
    displayedPatients.length > 0 && selectedIds.size === displayedPatients.length;
  const isSomeSelected =
    selectedIds.size > 0 && selectedIds.size < displayedPatients.length;

  const handleToggleAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(displayedPatients.map((p) => p.id)));
    }
  };

  const handleToggleRow = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleBatchApproveAndEmit = async () => {
    if (!hasActiveSubscription) {
      triggerPaywall("invoice");
      return;
    }

    setIsBatchProcessing(true);
    const ids = Array.from(selectedIds);
    try {
      for (const id of ids) {
        await approvePayment(id);
      }
      toast.success(
        `${ids.length} consulta(s) aprovada(s) e enviada(s) para emissão de NFS-e!`
      );
      setSelectedIds(new Set());
    } catch (err: any) {
      toast.error(err.message || "Erro ao processar consultas em lote.");
    } finally {
      setIsBatchProcessing(false);
    }
  };

  const handlePatientCreated = async (newPatientData: any) => {
    try {
      await addPatient(newPatientData);
      setIsFormOpen(false);
    } catch {
      // Erro tratado internamente
    }
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden w-full bg-background font-sans">
      {/* Barra de Ações em Lote */}
      {selectedIds.size > 0 && (
        <div className="bg-[#B7F20B] text-black px-6 py-2 flex items-center justify-between animate-in fade-in duration-150 border-b border-[#B7F20B]">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold">
              {selectedIds.size}{" "}
              {selectedIds.size === 1
                ? "paciente selecionado"
                : "pacientes selecionados"}
            </span>
            <span className="text-black/40">|</span>
            <button
              type="button"
              onClick={handleClearSelection}
              className="text-xs font-medium underline hover:text-black/80 flex items-center gap-1 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
              <span>Desmarcar todos</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="outline"
              disabled={isBatchProcessing}
              onClick={handleBatchApproveAndEmit}
              className="h-7 text-xs bg-black text-white hover:bg-black/90 hover:text-white border-black rounded-none gap-1.5 font-medium cursor-pointer"
            >
              <FileCheck className="h-3.5 w-3.5" />
              <span>
                {isBatchProcessing
                  ? "Processando..."
                  : `Aprovar & Emitir NFS-e (${selectedIds.size})`}
              </span>
            </Button>
          </div>
        </div>
      )}

      {/* Barra de Filtros e Ações */}
      <div className="px-6 py-3 border-y border-border bg-card/60 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          {/* Busca por Nome ou CPF */}
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou CPF..."
              className="pl-9 h-8 text-xs rounded-none bg-background border-border placeholder:text-muted-foreground/70 focus-visible:ring-1 focus-visible:ring-primary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Combobox / Select de Filtro por Médico Separado */}
          <div className="w-[220px]">
            <Select value={selectedDoctorId} onValueChange={setSelectedDoctorId}>
              <SelectTrigger className="h-8 text-xs rounded-none bg-background border-border">
                <SelectValue placeholder="Filtrar por Médico" />
              </SelectTrigger>
              <SelectContent className="rounded-none max-h-64">
                <SelectItem value="all">
                  <div className="flex items-center gap-2">
                    <Users className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>Todos os Médicos ({allDoctors.length})</span>
                  </div>
                </SelectItem>
                {allDoctors.map((doc) => (
                  <SelectItem key={doc.id} value={doc.id}>
                    <div className="flex items-center gap-2">
                      {doc.foto_perfil ? (
                        <img
                          src={doc.foto_perfil}
                          alt={doc.nome_completo}
                          className="h-4 w-4 rounded-full object-cover shrink-0 border border-border"
                        />
                      ) : (
                        <div className="h-4 w-4 rounded-full bg-muted border border-border text-[9px] font-bold flex items-center justify-center text-foreground shrink-0">
                          {doc.nome_completo.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <span className="truncate">{doc.nome_completo}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            onClick={() =>
              hasActiveSubscription
                ? setIsCsvImportOpen(true)
                : triggerPaywall("patient")
            }
            size="sm"
            className="h-8 px-3 rounded-none border-border bg-background hover:bg-muted text-foreground text-xs font-medium gap-1.5 transition-colors shadow-2xs cursor-pointer"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Importar CSV</span>
          </Button>

          <Button
            onClick={() =>
              hasActiveSubscription
                ? setIsFormOpen(true)
                : triggerPaywall("patient")
            }
            size="sm"
            className="h-8 px-3 rounded-none bg-[#B7F20B] hover:bg-[#B7F20B]/90 text-black font-semibold text-xs gap-1.5 transition-colors shadow-xs cursor-pointer"
          >
            <UserPlus className="h-3.5 w-3.5 text-black" />
            <span>Novo Paciente</span>
          </Button>
        </div>
      </div>

      {/* Tabela de Dados - Edge to Edge */}
      <div className="w-full rounded-none border-b border-border bg-card overflow-x-auto">
        <Table className="w-full whitespace-nowrap">
          <TableHeader className="bg-muted/30">
            <TableRow className="border-b border-border hover:bg-transparent h-8">
              <TableHead className="w-10 pl-6 pr-1 py-1.5 text-left align-middle">
                <Checkbox
                  checked={
                    isAllSelected ? true : isSomeSelected ? "indeterminate" : false
                  }
                  onCheckedChange={handleToggleAll}
                  aria-label="Selecionar todos os pacientes"
                />
              </TableHead>
              <TableHead className="font-display font-bold text-[11px] uppercase tracking-wider text-foreground/90 px-3 py-1.5 whitespace-nowrap">
                Paciente
              </TableHead>
              <TableHead className="font-display font-bold text-[11px] uppercase tracking-wider text-foreground/90 px-3 py-1.5 whitespace-nowrap">
                Médico Responsável
              </TableHead>
              <TableHead className="font-display font-bold text-[11px] uppercase tracking-wider text-foreground/90 px-3 py-1.5 whitespace-nowrap">
                E-mail
              </TableHead>
              <TableHead className="font-display font-bold text-[11px] uppercase tracking-wider text-foreground/90 px-3 py-1.5 whitespace-nowrap">
                CPF
              </TableHead>
              <TableHead className="font-display font-bold text-[11px] uppercase tracking-wider text-foreground/90 px-3 py-1.5 whitespace-nowrap">
                Telefone
              </TableHead>
              <TableHead className="font-display font-bold text-[11px] uppercase tracking-wider text-foreground/90 px-3 py-1.5 text-right whitespace-nowrap">
                Valor Consulta
              </TableHead>
              <TableHead className="font-display font-bold text-[11px] uppercase tracking-wider text-foreground/90 pr-6 pl-3 py-1.5 text-right whitespace-nowrap">
                Ações
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && displayedPatients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-28 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-1.5">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <span className="text-xs">Carregando registros...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={8} className="h-28 text-center text-destructive">
                  <span className="text-xs">Erro ao carregar dados: {error}</span>
                </TableCell>
              </TableRow>
            ) : displayedPatients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-28 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-1.5">
                    <FileSpreadsheet className="h-6 w-6 text-muted-foreground/40" />
                    <span className="text-xs font-medium">Nenhum paciente encontrado</span>
                    <span className="text-[11px] text-muted-foreground">
                      {selectedDoctorId !== "all"
                        ? "Nenhum paciente cadastrado para este médico."
                        : 'Clique em "Novo Paciente" para começar.'}
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              displayedPatients.map((patient) => {
                const isSelected = selectedIds.has(patient.id);
                const doctor = allDoctors.find((d) => d.id === patient.medico_id);

                return (
                  <TableRow
                    key={patient.id}
                    className={`border-b border-border/50 hover:bg-muted/30 transition-colors h-10 ${
                      isSelected ? "bg-[#B7F20B]/10 dark:bg-[#B7F20B]/10" : ""
                    }`}
                  >
                    <TableCell className="w-10 pl-6 pr-1 py-1.5 text-left align-middle">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleToggleRow(patient.id)}
                        aria-label={`Selecionar ${patient.nome_completo}`}
                      />
                    </TableCell>
                    <TableCell className="font-display font-medium text-xs text-foreground px-3 py-1.5 whitespace-nowrap">
                      {patient.nome_completo}
                    </TableCell>
                    {/* Coluna Médico com Foto e Nome */}
                    <TableCell className="px-3 py-1.5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {doctor?.foto_perfil ? (
                          <img
                            src={doctor.foto_perfil}
                            alt={doctor.nome_completo}
                            className="h-5 w-5 rounded-full object-cover border border-border shrink-0"
                          />
                        ) : (
                          <div className="h-5 w-5 rounded-full bg-muted border border-border text-[9px] font-bold flex items-center justify-center text-foreground shrink-0">
                            {doctor
                              ? doctor.nome_completo.slice(0, 2).toUpperCase()
                              : <Stethoscope className="h-3 w-3 text-muted-foreground" />}
                          </div>
                        )}
                        <span className="text-xs text-foreground font-medium truncate max-w-[150px]">
                          {doctor?.nome_completo || "Dr. Titular"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs px-3 py-1.5 whitespace-nowrap">
                      {patient.email}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground px-3 py-1.5 whitespace-nowrap">
                      {maskCPF(patient.cpf)}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground px-3 py-1.5 whitespace-nowrap">
                      {patient.telefone}
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium text-foreground text-xs px-3 py-1.5 whitespace-nowrap">
                      {formatCurrency(patient.valor_consulta)}
                    </TableCell>
                    <TableCell className="text-right pr-6 pl-3 py-1.5 whitespace-nowrap">
                      <PatientActions
                        patient={patient}
                        hasActiveSubscription={hasActiveSubscription}
                        onRequireSubscription={triggerPaywall}
                        onApprove={approvePayment}
                        onGenerateInvoice={generateInvoice}
                      />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* Rodapé da tabela */}
        <div className="flex items-center justify-between px-6 py-2.5 bg-muted/10 text-xs text-muted-foreground whitespace-nowrap">
          <span>
            {selectedIds.size > 0
              ? `${selectedIds.size} de ${displayedPatients.length} selecionado(s)`
              : `${displayedPatients.length} paciente(s) no total`}
          </span>
          <span className="font-mono text-[11px]">Atualizado em tempo real</span>
        </div>
      </div>

      <PatientFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        medicoId={selectedDoctorId !== "all" ? selectedDoctorId : (allDoctors[0]?.id || DEFAULT_MEDICO_ID)}
        onSuccess={handlePatientCreated}
      />

      {/* Dialog em Etapas de Importação de Pacientes via CSV */}
      <ImportPatientsCsvDialog
        open={isCsvImportOpen}
        onOpenChange={setIsCsvImportOpen}
      />

      {/* Trava de Assinatura (Paywall em Etapas com Cadeados) */}
      <SubscriptionRequiredDialog
        open={paywallOpen}
        onOpenChange={setPaywallOpen}
        actionBlocked={blockedAction}
      />
    </div>
  );
}
