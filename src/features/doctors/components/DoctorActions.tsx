import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import { Pencil, Trash2, Archive, ArchiveRestore, FileText } from "lucide-react";
import type { Doctor } from "../types";

interface DoctorActionsProps {
  doctor: Doctor;
  onEdit: (doctor: Doctor) => void;
  onDelete: (id: string) => Promise<void>;
  onArchive: (id: string) => Promise<void>;
  onUnarchive: (id: string) => Promise<void>;
  onConfigureFocus?: (doctor: Doctor) => void;
}

export function DoctorActions({
  doctor,
  onEdit,
  onDelete,
  onArchive,
  onUnarchive,
  onConfigureFocus,
}: DoctorActionsProps) {
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [isBusy, setIsBusy] = useState(false);

  const isArchived = doctor.status === "Arquivado";
  const isFocusConnected = Boolean(doctor.focus_empresa_id || doctor.focus_token);

  const handleDelete = async () => {
    setIsBusy(true);
    try {
      await onDelete(doctor.id);
      toast.success(`Dr(a). ${doctor.nome_completo} excluído com sucesso.`);
      setIsDeleteOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Erro ao excluir médico.");
    } finally {
      setIsBusy(false);
    }
  };

  const handleToggleArchive = async () => {
    setIsBusy(true);
    try {
      if (isArchived) {
        await onUnarchive(doctor.id);
        toast.success(`Dr(a). ${doctor.nome_completo} desarquivado e reativado.`);
      } else {
        await onArchive(doctor.id);
        toast.info(`Dr(a). ${doctor.nome_completo} arquivado.`);
      }
      setIsArchiveOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Erro ao alterar status do médico.");
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="flex items-center justify-end gap-0.5">

      {/* 1. Botão Editar */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onEdit(doctor)}
        title="Editar dados do médico"
        className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-accent rounded-none transition-colors"
      >
        <Pencil className="h-3.5 w-3.5" />
      </Button>

      {/* 2. Botão Arquivar / Desarquivar */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsArchiveOpen(true)}
        title={isArchived ? "Desarquivar médico" : "Arquivar médico"}
        className={`h-7 w-7 rounded-none transition-colors ${
          isArchived
            ? "text-amber-500 hover:text-amber-400 hover:bg-amber-500/10"
            : "text-muted-foreground hover:text-foreground hover:bg-accent"
        }`}
      >
        {isArchived ? (
          <ArchiveRestore className="h-3.5 w-3.5" />
        ) : (
          <Archive className="h-3.5 w-3.5" />
        )}
      </Button>

      {/* 3. Botão Excluir */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsDeleteOpen(true)}
        title="Excluir médico"
        className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-none transition-colors"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>

      {/* Modal de Confirmação de Exclusão */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent className="rounded-none border-border bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">Excluir Médico</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground font-sans">
              Tem certeza que deseja excluir o cadastro do(a){" "}
              <strong className="text-foreground">Dr(a). {doctor.nome_completo}</strong>?
              Esta ação removerá os vínculos e não poderá ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel disabled={isBusy} className="rounded-none">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isBusy}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-none"
            >
              {isBusy ? "Excluindo..." : "Sim, excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de Confirmação de Arquivamento */}
      <AlertDialog open={isArchiveOpen} onOpenChange={setIsArchiveOpen}>
        <AlertDialogContent className="rounded-none border-border bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">
              {isArchived ? "Desarquivar Médico" : "Arquivar Médico"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground font-sans">
              {isArchived ? (
                <>
                  Deseja reativar o cadastro do(a){" "}
                  <strong className="text-foreground">Dr(a). {doctor.nome_completo}</strong>?
                  Ele voltará a aparecer na listagem de médicos ativos.
                </>
              ) : (
                <>
                  Deseja arquivar o médico{" "}
                  <strong className="text-foreground">Dr(a). {doctor.nome_completo}</strong>?
                  O histórico de pacientes e notas fiscais será preservado, mas ele não constará na lista de seleção ativa.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel disabled={isBusy} className="rounded-none">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleToggleArchive}
              disabled={isBusy}
              className="bg-[#B7F20B] text-black font-semibold hover:bg-[#B7F20B]/90 rounded-none"
            >
              {isBusy ? "Processando..." : isArchived ? "Desarquivar" : "Arquivar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
