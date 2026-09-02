import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Lock,
  Unlock,
  Check,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Stethoscope,
  Users,
  FileText,
  CreditCard,
} from "lucide-react";

export type BlockedActionType = "doctor" | "patient" | "invoice" | "general";

interface SubscriptionRequiredDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actionBlocked?: BlockedActionType;
  onUpgradeClick?: () => void;
}

export function SubscriptionRequiredDialog({
  open,
  onOpenChange,
  actionBlocked = "general",
  onUpgradeClick,
}: SubscriptionRequiredDialogProps) {
  const getActionDetails = () => {
    switch (actionBlocked) {
      case "doctor":
        return {
          title: "Cadastro de Médicos Bloqueado",
          description:
            "Para cadastrar novos médicos, vincular CNPJs e configurar certificados de emissão, é necessário possuir uma assinatura ativa.",
          highlight: "Libere o cadastro de médicos e clínicas.",
        };
      case "patient":
        return {
          title: "Cadastro e Importação de Pacientes Bloqueados",
          description:
            "Para cadastrar novos pacientes, registrar consultas e realizar importações em lote via planilha CSV, é necessário possuir uma assinatura ativa.",
          highlight: "Libere o cadastro e importação em massa de pacientes.",
        };
      case "invoice":
        return {
          title: "Emissão de Notas Fiscais Bloqueada",
          description:
            "Para emitir notas fiscais de serviço (NFS-e), aprovar pagamentos e transmitir para a prefeitura, é necessário possuir uma assinatura ativa.",
          highlight: "Libere a emissão automatizada e download de NFS-e.",
        };
      default:
        return {
          title: "Recurso Bloqueado no Modo Simulação",
          description:
            "Você está utilizando o sistema em modo de demonstração. Ative um plano para desbloquear todas as ferramentas operacionais.",
          highlight: "Desbloqueie todos os recursos do Noto.",
        };
    }
  };

  const details = getActionDetails();

  const handleGoToPlans = () => {
    onOpenChange(false);
    onUpgradeClick?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[780px] max-h-[92vh] overflow-hidden p-0 gap-0 border-border bg-card rounded-none flex flex-col">
        {/* Header do Dialog */}
        <div className="px-6 py-4 border-b border-border bg-muted/20 shrink-0">
          <DialogHeader className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 dark:text-amber-400">
              <ShieldAlert className="h-4 w-4" />
              <span>Plano Ativo Obrigatório</span>
            </div>
            <DialogTitle className="text-lg font-display font-semibold text-foreground">
              {details.title}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground font-sans">
              Siga as etapas para desbloquear o acesso completo aos módulos do sistema.
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Corpo com Etapas no Lado Esquerdo e Apresentação no Lado Direito */}
        <div className="flex flex-1 overflow-hidden min-h-[360px]">
          {/* ─── LADO ESQUERDO: ETAPAS COM CADEADOS ─── */}
          <div className="w-72 border-r border-border bg-muted/10 p-4 space-y-2 shrink-0 select-none">
            <span className="text-[11px] font-mono uppercase text-muted-foreground font-semibold block px-1 mb-2">
              Fluxo de Desbloqueio
            </span>

            {/* Etapa 1: Ativação do Plano (Etapa atual / Desbloqueio disponível) */}
            <div className="p-3 border-2 border-[#B7F20B] bg-[#B7F20B]/10 rounded-none space-y-1 relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                  <CreditCard className="h-3.5 w-3.5 text-[#B7F20B]" />
                  <span>1. Assinar um Plano</span>
                </div>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 bg-[#B7F20B] text-black font-semibold">
                  Pendente
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-tight">
                Escolha o plano ideal para a sua clínica ou consultório.
              </p>
            </div>

            {/* Etapa 2: Cadastro de Médicos (Bloqueado) */}
            <div className="p-3 border border-border/80 bg-muted/20 rounded-none space-y-1 opacity-70">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                  <Stethoscope className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>2. Cadastrar Médicos</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono">
                  <Lock className="h-3 w-3 text-amber-500" />
                  <span>Bloqueado</span>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground leading-tight">
                Vincule CNPJs, CRM e dados fiscais da clínica.
              </p>
            </div>

            {/* Etapa 3: Pacientes & Consultas (Bloqueado) */}
            <div className="p-3 border border-border/80 bg-muted/20 rounded-none space-y-1 opacity-70">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>3. Gerenciar Pacientes</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono">
                  <Lock className="h-3 w-3 text-amber-500" />
                  <span>Bloqueado</span>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground leading-tight">
                Cadastro individual e importação em lote via CSV.
              </p>
            </div>

            {/* Etapa 4: Emissão de Notas Fiscais (Bloqueado) */}
            <div className="p-3 border border-border/80 bg-muted/20 rounded-none space-y-1 opacity-70">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                  <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>4. Emissão de NFS-e</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono">
                  <Lock className="h-3 w-3 text-amber-500" />
                  <span>Bloqueado</span>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground leading-tight">
                Transmissão direta e armazenamento por 90 dias.
              </p>
            </div>
          </div>

          {/* ─── LADO DIREITO: EXPLICAÇÃO & BENEFÍCIOS ─── */}
          <div className="flex-1 p-6 space-y-5 overflow-y-auto flex flex-col justify-between">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-mono font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  <Lock className="h-3 w-3" />
                  <span>Acesso Restrito</span>
                </div>
                <h3 className="text-base font-display font-bold text-foreground">
                  {details.highlight}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {details.description}
                </p>
              </div>

              {/* Lista de Vantagens ao Assinar */}
              <div className="p-4 border border-border bg-muted/20 space-y-2.5">
                <span className="text-xs font-semibold text-foreground block font-display">
                  Benefícios imediatos com o plano ativo:
                </span>
                <ul className="space-y-2 text-xs">
                  <li className="flex items-center gap-2 text-foreground">
                    <Check className="h-3.5 w-3.5 text-[#B7F20B] shrink-0" />
                    <span>Emissão e transmissão automatizada de NFS-e via Focus NF-e</span>
                  </li>
                  <li className="flex items-center gap-2 text-foreground">
                    <Check className="h-3.5 w-3.5 text-[#B7F20B] shrink-0" />
                    <span>Importação ilimitada de pacientes por planilha CSV</span>
                  </li>
                  <li className="flex items-center gap-2 text-foreground">
                    <Check className="h-3.5 w-3.5 text-[#B7F20B] shrink-0" />
                    <span>Download e guarda de XML e PDF das notas fiscais por 90 dias</span>
                  </li>
                  <li className="flex items-center gap-2 text-foreground">
                    <Check className="h-3.5 w-3.5 text-[#B7F20B] shrink-0" />
                    <span>Configuração de múltiplos médicos e alíquotas de ISS personalizadas</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Aviso Simples */}
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground pt-2">
              <Sparkles className="h-3.5 w-3.5 text-[#B7F20B]" />
              <span>Planos flexíveis a partir de R$ 97/mês com cancelamento a qualquer momento.</span>
            </div>
          </div>
        </div>

        {/* Rodapé com Botão de Ação */}
        <DialogFooter className="px-6 py-3 border-t border-border bg-muted/10 shrink-0 flex items-center justify-between sm:justify-between w-full">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-8 text-xs rounded-none"
          >
            Permanecer em Modo Demonstração
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleGoToPlans}
            className="h-8 text-xs font-semibold bg-[#B7F20B] hover:bg-[#B7F20B]/90 text-black gap-1.5 rounded-none shadow-xs cursor-pointer"
          >
            <span>Ver Planos e Assinar Agora</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
