"use client"

import * as React from "react"
import {
  X,
  ScrollText,
  FileText,
  Loader2,
  ExternalLink,
  Calendar,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { getHistoricoNotas } from "../pacientes.repository"
import type { Paciente, PacienteNotaSummary } from "../types"

interface PacienteNotasHistoryDialogProps {
  isOpen: boolean
  onClose: () => void
  paciente: Paciente | null
}

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

function formatDate(dateStr?: string) {
  if (!dateStr) return "-"
  const d = new Date(dateStr)
  return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString("pt-BR")
}

export function PacienteNotasHistoryDialog({
  isOpen,
  onClose,
  paciente,
}: PacienteNotasHistoryDialogProps) {
  const [notas, setNotas] = React.useState<PacienteNotaSummary[]>([])
  const [isLoading, setIsLoading] = React.useState(false)

  React.useEffect(() => {
    if (isOpen && paciente) {
      setIsLoading(true)
      getHistoricoNotas(paciente.id, paciente.cpf)
        .then((data) => setNotas(data))
        .catch((err) => console.error("Erro ao carregar histórico de notas:", err))
        .finally(() => setIsLoading(false))
    } else {
      setNotas([])
    }
  }, [isOpen, paciente])

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="sm:max-w-[540px] p-0 overflow-hidden border border-border bg-card text-foreground shadow-2xl rounded-xl">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/20">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <ScrollText strokeWidth={1.75} className="size-4" />
            </div>
            <div>
              <DialogTitle className="text-sm font-semibold text-foreground">
                Histórico de Notas Fiscais
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {paciente?.nome || "Paciente"} {paciente?.cpf ? `• CPF ${paciente.cpf}` : ""}
              </DialogDescription>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Lista de Notas Fiscais */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-10 space-y-2">
              <Loader2 className="size-6 text-muted-foreground animate-spin" />
              <p className="text-xs text-muted-foreground">Carregando notas emitidas...</p>
            </div>
          ) : notas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center space-y-2">
              <div className="size-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                <FileText className="size-5" />
              </div>
              <p className="text-xs font-medium text-foreground">Nenhuma nota fiscal encontrada</p>
              <p className="text-[11px] text-muted-foreground max-w-xs">
                Ainda não foram emitidas notas fiscais vinculadas a este paciente.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {notas.map((nota) => (
                <div
                  key={nota.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border bg-background hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded bg-muted/60 flex items-center justify-center text-foreground text-xs font-semibold">
                      #{nota.numero_nfse || "—"}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">
                        {formatBRL(nota.valor_servico)}
                      </p>
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
                        <Calendar className="size-3" />
                        <span>{formatDate(nota.data_emissao)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        nota.status === "cancelada"
                          ? "bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700"
                          : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400"
                      }`}
                    >
                      {nota.status === "cancelada" ? "Cancelada" : "Autorizada"}
                    </span>

                    {nota.pdf_url && (
                      <button
                        type="button"
                        onClick={() => window.open(nota.pdf_url, "_blank")}
                        title="Abrir PDF da NFS-e"
                        className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                      >
                        <ExternalLink className="size-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Rodapé */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-border bg-muted/10">
          <span className="text-xs text-muted-foreground">
            Total: <span className="font-semibold text-foreground">{notas.length}</span> notas
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-medium text-foreground bg-background border border-input rounded-md hover:bg-muted transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
