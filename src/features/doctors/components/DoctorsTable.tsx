import { useState } from "react";
import { useDoctors } from "../hooks/useDoctors";
import { useSubscription } from "@/features/billing/hooks/useSubscription";
import { DoctorActions } from "./DoctorActions";
import { DoctorFormDialog } from "./DoctorFormDialog";
import { DoctorFocusConfigDialog } from "./DoctorFocusConfigDialog";
import { SubscriptionRequiredDialog } from "@/features/billing/components/SubscriptionRequiredDialog";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  Search,
  UserPlus,
  Stethoscope,
  Users,
  Archive,
  ArchiveRestore,
  Trash2,
  X,
} from "lucide-react";
import type { Doctor } from "../types";

// Formata CNPJ (00.000.000/0000-00)
function formatCNPJ(cnpj?: string) {
  if (!cnpj) return "-";
  const digits = cnpj.replace(/\D/g, "");
  if (digits.length !== 14) return cnpj;
  return digits.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    "$1.$2.$3/$4-$5"
  );
}

interface DoctorsTableProps {
  onOpenNewDoctor?: () => void;
  onOpenDoctorSettings?: (doctor: Doctor) => void;
}

export function DoctorsTable({ onOpenNewDoctor, onOpenDoctorSettings }: DoctorsTableProps) {
  const {
    doctors,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    deleteDoctor,
    archiveDoctor,
    unarchiveDoctor,
    deleteDoctorsBatch,
    archiveDoctorsBatch,
    unarchiveDoctorsBatch,
  } = useDoctors();
  const { hasActiveSubscription } = useSubscription();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isNewDoctorOpen, setIsNewDoctorOpen] = useState(false);
  const [isPaywallOpen, setIsPaywallOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [focusDoctor, setFocusDoctor] = useState<Doctor | null>(null);

  // Modais de ações em massa
  const [isBatchDeleteOpen, setIsBatchDeleteOpen] = useState(false);
  const [isBatchArchiveOpen, setIsBatchArchiveOpen] = useState(false);
  const [isBatchUnarchiveOpen, setIsBatchUnarchiveOpen] = useState(false);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);

  const isAllSelected = doctors.length > 0 && selectedIds.size === doctors.length;
  const isSomeSelected = selectedIds.size > 0 && selectedIds.size < doctors.length;

  const handleToggleAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(doctors.map((d) => d.id)));
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

  const handleBatchArchive = async () => {
    setIsBatchProcessing(true);
    const ids = Array.from(selectedIds);
    try {
      await archiveDoctorsBatch(ids);
      toast.info(`${ids.length} médico(s) arquivado(s).`);
      setSelectedIds(new Set());
      setIsBatchArchiveOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Erro ao arquivar médicos selecionados.");
    } finally {
      setIsBatchProcessing(false);
    }
  };

  const handleBatchUnarchive = async () => {
    setIsBatchProcessing(true);
    const ids = Array.from(selectedIds);
    try {
      await unarchiveDoctorsBatch(ids);
      toast.success(`${ids.length} médico(s) reativado(s).`);
      setSelectedIds(new Set());
      setIsBatchUnarchiveOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Erro ao reativar médicos selecionados.");
    } finally {
      setIsBatchProcessing(false);
    }
  };

  const handleBatchDelete = async () => {
    setIsBatchProcessing(true);
    const ids = Array.from(selectedIds);
    try {
      await deleteDoctorsBatch(ids);
      toast.success(`${ids.length} médico(s) excluído(s).`);
      setSelectedIds(new Set());
      setIsBatchDeleteOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Erro ao excluir médicos selecionados.");
    } finally {
      setIsBatchProcessing(false);
    }
  };

  const handleEdit = (doctor: Doctor) => {
    setEditingDoctor(doctor);
  };

  const handleDoctorCreatedOrUpdated = () => {
    setEditingDoctor(null);
  };

  return (
    <div className="w-full space-y-0">
      {/* ── Barra de Ações em Massa (Aparece quando 1+ registros são selecionados) ── */}
      {selectedIds.size > 0 && (
        <div className="px-6 py-2.5 bg-[#B7F20B] text-black border-y border-[#B7F20B] flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="flex items-center gap-3">
            <span className="font-display font-bold text-xs uppercase tracking-wider">
              {selectedIds.size} {selectedIds.size === 1 ? "médico selecionado" : "médicos selecionados"}
            </span>
            <span className="text-black/40">|</span>
            <button
              type="button"
              onClick={handleClearSelection}
              className="text-xs font-medium underline hover:text-black/80 flex items-center gap-1"
            >
              <X className="h-3.5 w-3.5" />
              <span>Desmarcar todos</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsBatchArchiveOpen(true)}
              className="h-7 text-xs bg-black text-white hover:bg-black/90 hover:text-white border-black rounded-none gap-1.5 font-medium"
            >
              <Archive className="h-3.5 w-3.5" />
              <span>Arquivar ({selectedIds.size})</span>
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsBatchUnarchiveOpen(true)}
              className="h-7 text-xs bg-black text-white hover:bg-black/90 hover:text-white border-black rounded-none gap-1.5 font-medium"
            >
              <ArchiveRestore className="h-3.5 w-3.5" />
              <span>Reativar ({selectedIds.size})</span>
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsBatchDeleteOpen(true)}
              className="h-7 text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90 border-destructive rounded-none gap-1.5 font-medium"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Excluir ({selectedIds.size})</span>
            </Button>
          </div>
        </div>
      )}

      {/* Barra de Filtros e Ações - Full Width Edge-to-Edge */}
      <div className="px-6 py-3 border-y border-border bg-card/60 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Buscar por médico, CRM, CNPJ..."
              className="pl-9 h-8 text-xs rounded-none bg-background border-border placeholder:text-muted-foreground/70 focus-visible:ring-1 focus-visible:ring-primary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="w-[150px]">
            <Select
              value={statusFilter}
              onValueChange={(val: "Todos" | "Ativo" | "Arquivado") => setStatusFilter(val)}
            >
              <SelectTrigger className="h-8 text-xs rounded-none bg-background border-border">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="rounded-none">
                <SelectItem value="Todos">Todos os status</SelectItem>
                <SelectItem value="Ativo">Ativos</SelectItem>
                <SelectItem value="Arquivado">Arquivados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => {
              if (!hasActiveSubscription) {
                setIsPaywallOpen(true);
                return;
              }
              if (onOpenNewDoctor) {
                onOpenNewDoctor();
              } else {
                setIsNewDoctorOpen(true);
              }
            }}
            size="sm"
            className="h-8 px-3 rounded-none bg-[#B7F20B] hover:bg-[#B7F20B]/90 text-black font-semibold text-xs gap-1.5 transition-colors shadow-xs cursor-pointer"
          >
            <UserPlus className="h-3.5 w-3.5 text-black" />
            <span>Novo Médico</span>
          </Button>
        </div>
      </div>

      {/* Tabela de Médicos - 100% Width Edge-to-Edge com Checkbox e Linhas Compactas */}
      <div className="w-full rounded-none border-b border-border bg-card overflow-x-auto">
        <Table className="w-full whitespace-nowrap">
          <TableHeader className="bg-muted/30">
            <TableRow className="border-b border-border hover:bg-transparent h-8">
              {/* Checkbox selecionar todos */}
              <TableHead className="w-10 pl-6 pr-1 py-1.5 text-left align-middle">
                <Checkbox
                  checked={isAllSelected ? true : isSomeSelected ? "indeterminate" : false}
                  onCheckedChange={handleToggleAll}
                  aria-label="Selecionar todos os médicos"
                />
              </TableHead>
              <TableHead className="font-display font-bold text-[11px] uppercase tracking-wider text-foreground/90 px-3 py-1.5 whitespace-nowrap">
                Nome e Sobrenome
              </TableHead>
              <TableHead className="font-display font-bold text-[11px] uppercase tracking-wider text-foreground/90 px-3 py-1.5 whitespace-nowrap">
                CRM
              </TableHead>
              <TableHead className="font-display font-bold text-[11px] uppercase tracking-wider text-foreground/90 px-3 py-1.5 whitespace-nowrap">
                CNPJ
              </TableHead>
              <TableHead className="font-display font-bold text-[11px] uppercase tracking-wider text-foreground/90 px-3 py-1.5 text-center whitespace-nowrap">
                Emissora
              </TableHead>
              <TableHead className="font-display font-bold text-[11px] uppercase tracking-wider text-foreground/90 px-3 py-1.5 text-center whitespace-nowrap">
                Qtd. Pacientes
              </TableHead>
              <TableHead className="font-display font-bold text-[11px] uppercase tracking-wider text-foreground/90 pr-6 pl-3 py-1.5 text-right whitespace-nowrap">
                Ações
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && doctors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-28 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-1.5">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <span className="text-xs">Carregando médicos...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={7} className="h-28 text-center text-destructive">
                  <span className="text-xs">Erro ao carregar dados: {error}</span>
                </TableCell>
              </TableRow>
            ) : doctors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-28 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-1.5">
                    <Stethoscope className="h-6 w-6 text-muted-foreground/40" />
                    <span className="text-xs font-medium">Nenhum médico encontrado</span>
                    <span className="text-[11px] text-muted-foreground">
                      Clique em "Novo Médico" para cadastrar o primeiro profissional.
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              doctors.map((doctor) => {
                const initials = doctor.nome_completo
                  .split(" ")
                  .filter(Boolean)
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase();

                const isArchived = doctor.status === "Arquivado";
                const isSelected = selectedIds.has(doctor.id);

                return (
                  <TableRow
                    key={doctor.id}
                    className={`border-b border-border/50 hover:bg-muted/30 transition-colors h-10 ${
                      isSelected
                        ? "bg-[#B7F20B]/10 dark:bg-[#B7F20B]/10"
                        : isArchived
                        ? "opacity-60 bg-muted/10"
                        : ""
                    }`}
                  >
                    {/* Checkbox linha */}
                    <TableCell className="w-10 pl-6 pr-1 py-1.5 text-left align-middle">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleToggleRow(doctor.id)}
                        aria-label={`Selecionar ${doctor.nome_completo}`}
                      />
                    </TableCell>

                    {/* 1. Foto de perfil (radius 100%) + Nome e Sobrenome em linha única */}
                    <TableCell className="px-3 py-1.5 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        {doctor.foto_perfil ? (
                          <img
                            src={doctor.foto_perfil}
                            alt={doctor.nome_completo}
                            className="h-6 w-6 rounded-full object-cover shrink-0 border border-border"
                            style={{ borderRadius: "100%" }}
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = "none";
                            }}
                          />
                        ) : (
                          <div
                            className="h-6 w-6 rounded-full bg-muted border border-border/80 flex items-center justify-center text-[10px] font-semibold text-foreground shrink-0"
                            style={{ borderRadius: "100%" }}
                          >
                            {initials || "DR"}
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <span className="font-display font-medium text-xs text-foreground">
                            {doctor.nome_completo}
                          </span>
                          {isArchived && (
                            <span className="text-[9px] uppercase font-mono px-1 py-0.2 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                              Arquivado
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    {/* 2. CRM em linha única */}
                    <TableCell className="text-xs text-foreground px-3 py-1.5 whitespace-nowrap">
                      <span className="inline-flex items-center px-1.5 py-0.5 text-[11px] font-mono font-medium bg-muted/50 text-foreground border border-border/60 uppercase">
                        {doctor.crm || "ISENTO"}
                      </span>
                    </TableCell>

                    {/* 3. CNPJ em linha única */}
                    <TableCell className="font-mono text-xs text-muted-foreground px-3 py-1.5 whitespace-nowrap">
                      {formatCNPJ(doctor.cnpj)}
                    </TableCell>

                    {/* 4. Emissora (apenas "GOV") em linha única */}
                    <TableCell className="text-center px-3 py-1.5 whitespace-nowrap">
                      <span className="inline-flex items-center justify-center px-2 py-0.2 text-[11px] font-mono font-semibold bg-primary/10 text-primary dark:text-[#B7F20B] border border-primary/20">
                        {doctor.emissora || "GOV"}
                      </span>
                    </TableCell>

                    {/* 5. Quantidade de pacientes em linha única */}
                    <TableCell className="text-center px-3 py-1.5 whitespace-nowrap">
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted/30 border border-border font-mono text-xs font-medium text-foreground">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        <span>{doctor.total_pacientes ?? 0}</span>
                      </div>
                    </TableCell>

                    {/* 6. Ações (Editar, Arquivar, Excluir, Focus NF-e) em linha única */}
                    <TableCell className="text-right pr-6 pl-3 py-1.5 whitespace-nowrap">
                      <DoctorActions
                        doctor={doctor}
                        onEdit={handleEdit}
                        onDelete={deleteDoctor}
                        onArchive={archiveDoctor}
                        onUnarchive={unarchiveDoctor}
                        onConfigureFocus={(doc: Doctor) => {
                          if (onOpenDoctorSettings) {
                            onOpenDoctorSettings(doc);
                          } else {
                            setFocusDoctor(doc);
                          }
                        }}
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
              ? `${selectedIds.size} de ${doctors.length} selecionado(s)`
              : `${doctors.length} médico(s) cadastrado(s)`}
          </span>
          <span className="font-mono text-[11px]">Sincronização ativa</span>
        </div>
      </div>

      {/* Dialog de Cadastro / Edição de Médico */}
      <DoctorFormDialog
        open={isNewDoctorOpen || Boolean(editingDoctor)}
        doctorToEdit={editingDoctor}
        onOpenChange={(open) => {
          setIsNewDoctorOpen(open);
          if (!open) setEditingDoctor(null);
        }}
        onSuccess={handleDoctorCreatedOrUpdated}
        onNavigateToInvoices={() => {
          if (editingDoctor) setFocusDoctor(editingDoctor);
        }}
      />

      {/* Dialog de Configuração e Sincronização com a Focus NF-e */}
      <DoctorFocusConfigDialog
        doctor={focusDoctor}
        open={Boolean(focusDoctor)}
        onOpenChange={(open) => {
          if (!open) setFocusDoctor(null);
        }}
      />

      {/* Modal de Exclusão em Massa */}
      <AlertDialog open={isBatchDeleteOpen} onOpenChange={setIsBatchDeleteOpen}>
        <AlertDialogContent className="rounded-none border-border bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">Excluir Médicos Selecionados</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground font-sans">
              Tem certeza que deseja excluir os <strong>{selectedIds.size}</strong> médicos selecionados?
              Esta ação removerá todos os vínculos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel disabled={isBatchProcessing} className="rounded-none">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBatchDelete}
              disabled={isBatchProcessing}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-none"
            >
              {isBatchProcessing ? "Excluindo..." : `Sim, excluir ${selectedIds.size}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de Arquivamento em Massa */}
      <AlertDialog open={isBatchArchiveOpen} onOpenChange={setIsBatchArchiveOpen}>
        <AlertDialogContent className="rounded-none border-border bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">Arquivar Médicos Selecionados</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground font-sans">
              Deseja arquivar os <strong>{selectedIds.size}</strong> médicos selecionados?
              Eles não aparecerão na listagem ativa, mas o histórico fiscal e de consultas será mantido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel disabled={isBatchProcessing} className="rounded-none">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBatchArchive}
              disabled={isBatchProcessing}
              className="bg-[#B7F20B] text-black font-semibold hover:bg-[#B7F20B]/90 rounded-none"
            >
              {isBatchProcessing ? "Processando..." : `Arquivar ${selectedIds.size}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de Reativação em Massa */}
      <AlertDialog open={isBatchUnarchiveOpen} onOpenChange={setIsBatchUnarchiveOpen}>
        <AlertDialogContent className="rounded-none border-border bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">Reativar Médicos Selecionados</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground font-sans">
              Deseja reativar os <strong>{selectedIds.size}</strong> médicos selecionados para o status Ativo?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel disabled={isBatchProcessing} className="rounded-none">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBatchUnarchive}
              disabled={isBatchProcessing}
              className="bg-[#B7F20B] text-black font-semibold hover:bg-[#B7F20B]/90 rounded-none"
            >
              {isBatchProcessing ? "Processando..." : `Reativar ${selectedIds.size}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Trava de Assinatura (Paywall) */}
      <SubscriptionRequiredDialog
        open={isPaywallOpen}
        onOpenChange={setIsPaywallOpen}
        actionBlocked="doctor"
      />
    </div>
  );
}
