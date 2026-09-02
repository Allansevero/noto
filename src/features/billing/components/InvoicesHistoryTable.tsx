import type { BillingInvoice } from "../types";
import { formatMoney } from "../services/billing.service";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Receipt,
  CheckCircle2,
  Clock,
  AlertCircle,
  Copy,
  Download,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

interface InvoicesHistoryTableProps {
  invoices: BillingInvoice[];
}

export function InvoicesHistoryTable({ invoices }: InvoicesHistoryTableProps) {
  const handleCopyPix = (pixText?: string | null) => {
    if (!pixText) return;
    navigator.clipboard.writeText(pixText);
    toast.success("Código PIX Copia e Cola copiado com sucesso!");
  };

  return (
    <div className="space-y-3 w-full">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-display font-bold text-foreground">
            Histórico de Faturas & Cobranças
          </h3>
          <p className="text-xs text-muted-foreground font-sans">
            Acompanhe o status dos pagamentos mensais da sua assinatura.
          </p>
        </div>
      </div>

      <div className="w-full border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="h-9 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider pl-4">
                Fatura / Referência
              </TableHead>
              <TableHead className="h-9 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Emissão
              </TableHead>
              <TableHead className="h-9 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Vencimento
              </TableHead>
              <TableHead className="h-9 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider text-right">
                Valor
              </TableHead>
              <TableHead className="h-9 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider text-center">
                Status
              </TableHead>
              <TableHead className="h-9 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider text-right pr-4">
                Ações & Comprovantes
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-xs text-muted-foreground">
                  Nenhuma fatura registrada no Supabase.
                </TableCell>
              </TableRow>
            ) : (
              invoices.map((inv) => {
                const dataEmissaoFormatted = new Date(inv.data_emissao).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                });
                const dataVencimentoFormatted = new Date(inv.data_vencimento).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                });

                return (
                  <TableRow key={inv.id} className="border-border hover:bg-muted/30">
                    <TableCell className="pl-4 py-2.5 font-mono text-xs font-semibold text-foreground">
                      {inv.numero_fatura}
                    </TableCell>

                    <TableCell className="py-2.5 text-xs text-muted-foreground font-mono">
                      {dataEmissaoFormatted}
                    </TableCell>

                    <TableCell className="py-2.5 text-xs text-muted-foreground font-mono">
                      {dataVencimentoFormatted}
                    </TableCell>

                    <TableCell className="text-right py-2.5 font-mono text-xs font-semibold text-foreground">
                      {formatMoney(inv.valor)}
                    </TableCell>

                    <TableCell className="text-center py-2.5">
                      {inv.status === "Paga" ? (
                        <span
                          className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 inline-flex items-center gap-1"
                          style={{ borderRadius: "100px" }}
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Paga</span>
                        </span>
                      ) : inv.status === "Pendente" ? (
                        <span
                          className="px-2 py-0.5 text-[10px] font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 inline-flex items-center gap-1"
                          style={{ borderRadius: "100px" }}
                        >
                          <Clock className="h-3 w-3" />
                          <span>Pendente</span>
                        </span>
                      ) : (
                        <span
                          className="px-2 py-0.5 text-[10px] font-semibold bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30 inline-flex items-center gap-1"
                          style={{ borderRadius: "100px" }}
                        >
                          <AlertCircle className="h-3 w-3" />
                          <span>{inv.status}</span>
                        </span>
                      )}
                    </TableCell>

                    <TableCell className="text-right pr-4 py-2.5">
                      <div className="flex items-center justify-end gap-1.5">
                        {inv.status === "Pendente" && inv.pix_copia_cola && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopyPix(inv.pix_copia_cola)}
                            className="h-7 text-xs rounded-none gap-1 bg-[#B7F20B]/10 text-foreground border-[#B7F20B]/40 font-medium"
                          >
                            <Copy className="h-3 w-3 text-[#B7F20B]" />
                            <span>Pagar com PIX</span>
                          </Button>
                        )}

                        {inv.status === "Paga" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toast.info("Comprovante fiscal disponível para download.")}
                            className="h-7 text-xs rounded-none text-muted-foreground hover:text-foreground gap-1"
                          >
                            <Download className="h-3 w-3" />
                            <span>Recibo</span>
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
    </div>
  );
}
