import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { Patient } from "../types";
import { formatCurrency } from "@/shared/utils";
import { toast } from "sonner";
import type { BlockedActionType } from "@/features/billing/components/SubscriptionRequiredDialog";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  FileText,
  RefreshCw,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Calendar,
} from "lucide-react";

interface PatientActionsProps {
  patient: Patient;
  hasActiveSubscription?: boolean;
  onRequireSubscription?: (action: BlockedActionType) => void;
  onApprove: (id: string) => Promise<void> | void;
  onGenerateInvoice: (id: string, dataConsulta?: string) => Promise<void> | void;
}

export function PatientActions({
  patient,
  hasActiveSubscription = true,
  onRequireSubscription,
  onApprove,
  onGenerateInvoice,
}: PatientActionsProps) {
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [isErrorDetailsOpen, setIsErrorDetailsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const checkSubscriptionOrProceed = (action: BlockedActionType, callback: () => void) => {
    if (!hasActiveSubscription) {
      onRequireSubscription?.(action);
      return;
    }
    callback();
  };

  // Data da consulta padrão (YYYY-MM-DD)
  const getInitialDate = () => {
    if (patient.data_consulta) return patient.data_consulta.slice(0, 10);
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  };

  const [dataConsulta, setDataConsulta] = useState(getInitialDate);

  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      await onApprove(patient.id);
      toast.success(`Pagamento de ${patient.nome_completo} aprovado.`);
      setIsApproveOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Erro ao aprovar pagamento.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInvoice = async () => {
    setIsSubmitting(true);
    try {
      await onGenerateInvoice(patient.id, dataConsulta);
      toast.info(`Emissão da nota de ${patient.nome_completo} enviada para a prefeitura.`);
      setIsInvoiceOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Erro ao solicitar emissão da nota.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* 1. Status Pendente: Aprovar Pagamento */}
      {patient.status === "Pendente" && (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              checkSubscriptionOrProceed("invoice", () => setIsApproveOpen(true))
            }
            className="h-8 text-xs rounded-none font-medium"
          >
            Aprovar Pagamento
          </Button>

          <AlertDialog open={isApproveOpen} onOpenChange={setIsApproveOpen}>
            <AlertDialogContent className="rounded-none sm:max-w-[450px]">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-base font-semibold">Aprovar Pagamento</AlertDialogTitle>
                <AlertDialogDescription className="text-xs text-muted-foreground">
                  Confirmar recebimento do pagamento de{" "}
                  <strong className="text-foreground">{formatCurrency(patient.valor_consulta)}</strong> do paciente{" "}
                  <strong className="text-foreground">{patient.nome_completo}</strong>?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="pt-3 border-t">
                <AlertDialogCancel disabled={isSubmitting} className="h-8 text-xs rounded-none">
                  Cancelar
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleApprove}
                  disabled={isSubmitting}
                  className="h-8 text-xs font-semibold bg-[#B7F20B] hover:bg-[#B7F20B]/90 text-black rounded-none"
                >
                  {isSubmitting ? "Aprovando..." : "Confirmar Pagamento"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}

      {/* 2. Status Aprovado: Gerar Nota */}
      {patient.status === "Aprovado" && (
        <>
          <Button
            variant="default"
            size="sm"
            onClick={() =>
              checkSubscriptionOrProceed("invoice", () => {
                setDataConsulta(getInitialDate());
                setIsInvoiceOpen(true);
              })
            }
            className="h-8 text-xs font-semibold bg-[#B7F20B] hover:bg-[#B7F20B]/90 text-black rounded-none shadow-xs"
          >
            <FileText className="mr-1.5 h-3.5 w-3.5" />
            Gerar Nota
          </Button>

          {/* Dialog de Confirmação com Data da Consulta */}
          <Dialog open={isInvoiceOpen} onOpenChange={setIsInvoiceOpen}>
            <DialogContent className="rounded-none sm:max-w-[480px] p-6 space-y-4">
              <DialogHeader className="space-y-1.5">
                <DialogTitle className="text-base font-display font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4 text-[#B7F20B]" />
                  Confirmar Emissão da Nota Fiscal (NFS-e)
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Deseja realmente gerar a NFS-e deste atendimento para autorização junto à prefeitura?
                </DialogDescription>
              </DialogHeader>

              {/* Resumo do Atendimento */}
              <div className="bg-muted/30 p-3.5 border border-border space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Paciente:</span>
                  <strong className="text-foreground">{patient.nome_completo}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">CPF do Tomador:</span>
                  <span className="font-mono text-foreground">{patient.cpf}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valor do Serviço:</span>
                  <strong className="text-[#B7F20B] font-semibold">{formatCurrency(patient.valor_consulta)}</strong>
                </div>
              </div>

              {/* Campo: Qual dia da consulta? */}
              <div className="space-y-1.5 pt-1">
                <Label htmlFor="data_consulta_input" className="text-xs font-medium flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  Qual o dia da consulta realizada? *
                </Label>
                <Input
                  id="data_consulta_input"
                  type="date"
                  value={dataConsulta}
                  onChange={(e) => setDataConsulta(e.target.value)}
                  className="h-9 text-xs rounded-none font-mono"
                  required
                />
                <p className="text-[11px] text-muted-foreground">
                  Esta data será utilizada como data de competência e constará na discriminação da nota fiscal.
                </p>
              </div>

              <DialogFooter className="pt-3 border-t border-border flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isSubmitting}
                  onClick={() => setIsInvoiceOpen(false)}
                  className="h-8 text-xs rounded-none"
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={isSubmitting || !dataConsulta}
                  onClick={handleInvoice}
                  className="h-8 text-xs font-semibold bg-[#B7F20B] hover:bg-[#B7F20B]/90 text-black rounded-none shadow-xs gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Emitindo NFS-e...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Confirmar e Gerar Nota</span>
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}

      {/* 3. Status Processando Emissão: Botão Bloqueado com Loader */}
      {patient.status === "Processando emissão" && (
        <Button
          variant="secondary"
          size="sm"
          disabled
          className="h-8 text-xs rounded-none opacity-80 cursor-not-allowed bg-muted text-muted-foreground border border-border/60 gap-1.5"
        >
          <Loader2 className="h-3.5 w-3.5 animate-spin text-[#B7F20B]" />
          <span>Aguardando prefeitura...</span>
        </Button>
      )}

      {/* 4. Status Erro na Emissão */}
      {patient.status === "Erro na emissão" && (
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs rounded-none border-red-300 text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
            onClick={() => setIsErrorDetailsOpen(true)}
          >
            <AlertCircle className="mr-1 h-3.5 w-3.5 text-red-600" />
            Ver Erro
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={() =>
              checkSubscriptionOrProceed("invoice", () => {
                setDataConsulta(getInitialDate());
                setIsInvoiceOpen(true);
              })
            }
            disabled={isSubmitting}
            className="h-8 text-xs font-semibold bg-[#B7F20B] hover:bg-[#B7F20B]/90 text-black rounded-none"
          >
            <RefreshCw className={`mr-1 h-3.5 w-3.5 ${isSubmitting ? "animate-spin" : ""}`} />
            Tentar Novamente
          </Button>

          <Dialog open={isErrorDetailsOpen} onOpenChange={setIsErrorDetailsOpen}>
            <DialogContent className="rounded-none sm:max-w-[480px]">
              <DialogHeader>
                <DialogTitle className="text-red-600 flex items-center gap-2 text-sm font-semibold">
                  <AlertCircle className="h-4 w-4" />
                  Falha na Emissão da NFS-e
                </DialogTitle>
                <DialogDescription className="pt-2 text-foreground space-y-3 text-xs">
                  <p className="text-muted-foreground">
                    A prefeitura ou o validador retornou a seguinte mensagem:
                  </p>
                  <div className="bg-muted p-3 text-xs font-mono whitespace-pre-wrap border border-border">
                    {patient.nfse_erro_motivo || "Erro não especificado no processamento."}
                  </div>
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="pt-3 border-t">
                <Button variant="outline" size="sm" onClick={() => setIsErrorDetailsOpen(false)} className="h-8 text-xs rounded-none">
                  Fechar
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setIsErrorDetailsOpen(false);
                    checkSubscriptionOrProceed("invoice", () => setIsInvoiceOpen(true));
                  }}
                  className="h-8 text-xs font-semibold bg-[#B7F20B] hover:bg-[#B7F20B]/90 text-black rounded-none"
                >
                  Reemitir Nota
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* 5. Status Nota Gerada: Botão para Gerar Nova Nota disponível continuamente */}
      {patient.status === "Nota Gerada" && (
        <>
          <Button
            variant="default"
            size="sm"
            onClick={() =>
              checkSubscriptionOrProceed("invoice", () => {
                setDataConsulta(getInitialDate());
                setIsInvoiceOpen(true);
              })
            }
            className="h-8 text-xs font-semibold bg-[#B7F20B] hover:bg-[#B7F20B]/90 text-black rounded-none shadow-xs gap-1.5 cursor-pointer"
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Gerar Nova Nota</span>
          </Button>

          {/* Dialog de Confirmação de Nova Emissão */}
          <Dialog open={isInvoiceOpen} onOpenChange={setIsInvoiceOpen}>
            <DialogContent className="rounded-none sm:max-w-[480px] p-6 space-y-4">
              <DialogHeader className="space-y-1.5">
                <DialogTitle className="text-base font-display font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4 text-[#B7F20B]" />
                  Emitir Nova Nota Fiscal (NFS-e)
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Gere uma nova NFS-e para este paciente referente a um novo atendimento ou consulta.
                </DialogDescription>
              </DialogHeader>

              {/* Resumo do Atendimento */}
              <div className="bg-muted/30 p-3.5 border border-border space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Paciente:</span>
                  <strong className="text-foreground">{patient.nome_completo}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">CPF do Tomador:</span>
                  <span className="font-mono text-foreground">{patient.cpf}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valor do Serviço:</span>
                  <strong className="text-[#B7F20B] font-semibold">{formatCurrency(patient.valor_consulta)}</strong>
                </div>
              </div>

              {/* Campo: Qual dia da consulta? */}
              <div className="space-y-1.5 pt-1">
                <Label htmlFor="data_nova_consulta_input" className="text-xs font-medium flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  Qual o dia do novo atendimento? *
                </Label>
                <Input
                  id="data_nova_consulta_input"
                  type="date"
                  value={dataConsulta}
                  onChange={(e) => setDataConsulta(e.target.value)}
                  className="h-9 text-xs rounded-none font-mono"
                  required
                />
                <p className="text-[11px] text-muted-foreground">
                  Esta data será utilizada como data de competência da nova nota fiscal.
                </p>
              </div>

              <DialogFooter className="pt-3 border-t border-border flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isSubmitting}
                  onClick={() => setIsInvoiceOpen(false)}
                  className="h-8 text-xs rounded-none"
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={isSubmitting || !dataConsulta}
                  onClick={handleInvoice}
                  className="h-8 text-xs font-semibold bg-[#B7F20B] hover:bg-[#B7F20B]/90 text-black rounded-none shadow-xs gap-1.5 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Emitindo NFS-e...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Confirmar e Gerar Nota</span>
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
