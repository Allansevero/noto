import type { Plan } from "../types";
import { formatMoney } from "../services/billing.service";
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
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  ExternalLink,
  Lock,
} from "lucide-react";
import { toast } from "sonner";

const CHECKOUT_URLS: Record<string, string> = {
  basico: "https://invoice.infinitepay.io/plans/respiru/HwvkqORyco",
  profissional: "https://invoice.infinitepay.io/plans/respiru/aZnWNexG3Y",
  agencia: "https://invoice.infinitepay.io/plans/respiru/1JNDry40A2",
};

interface UpgradePlanDialogProps {
  plan: Plan | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UpgradePlanDialog({
  plan,
  open,
  onOpenChange,
}: UpgradePlanDialogProps) {
  if (!plan) return null;

  const checkoutUrl = plan.checkout_url || CHECKOUT_URLS[plan.id];

  const handleOpenInfinitePay = () => {
    if (checkoutUrl) {
      window.open(checkoutUrl, "_blank", "noopener,noreferrer");
      toast.success(`Abrindo checkout do Plano ${plan.nome}...`, {
        description: "Você foi redirecionado para a página oficial e segura da InfinitePay.",
      });
    } else {
      toast.error("Link de pagamento não encontrado.");
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-none sm:max-w-[500px] p-6 space-y-4">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#B7F20B]">
            <Sparkles className="h-4 w-4" />
            <span>Assinatura do Plano</span>
          </div>
          <DialogTitle className="text-lg font-display font-bold text-foreground">
            Contratar Plano {plan.nome}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Acesso para {plan.cnpjs_inclusos} CNPJs de médicos e {plan.notas_mes_limite.toLocaleString("pt-BR")} notas fiscais/mês.
          </DialogDescription>
        </DialogHeader>

        {/* Resumo do Pedido */}
        <div className="p-4 border border-border bg-muted/20 space-y-3 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Plano Selecionado:</span>
            <strong className="text-foreground font-semibold">{plan.nome} ({plan.perfil_cliente})</strong>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Valor da Assinatura:</span>
            <strong className="text-xl font-display font-bold text-[#B7F20B]">{formatMoney(plan.preco_mensal)}/mês</strong>
          </div>
          <div className="flex justify-between items-center text-[11px] text-muted-foreground pt-1 border-t border-border/60">
            <span>Processamento:</span>
            <span className="flex items-center gap-1 text-foreground font-medium">
              <Lock className="h-3 w-3 text-emerald-500" /> InfinitePay Checkout Seguro
            </span>
          </div>
        </div>

        {/* Informações de Pagamento InfinitePay */}
        <div className="p-3.5 border border-[#B7F20B]/40 bg-[#B7F20B]/5 space-y-2 text-xs">
          <p className="text-foreground font-medium flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-[#B7F20B]" />
            Pagamento via Cartão de Crédito ou PIX Recorrente
          </p>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Ao clicar no botão abaixo, você será redirecionado para a página oficial da <strong>InfinitePay</strong>. O sistema reconhecerá automaticamente seus acessos assim que a fatura for confirmada no Supabase.
          </p>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
          <span>Ativação automática via Supabase e garantia de 7 dias com reembolso total.</span>
        </div>

        <DialogFooter className="pt-3 border-t border-border flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-8 text-xs rounded-none"
          >
            Voltar
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleOpenInfinitePay}
            className="h-8 text-xs font-semibold bg-[#B7F20B] hover:bg-[#B7F20B]/90 text-black rounded-none shadow-xs gap-1.5 cursor-pointer"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>Ir para o Pagamento ({formatMoney(plan.preco_mensal)})</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
