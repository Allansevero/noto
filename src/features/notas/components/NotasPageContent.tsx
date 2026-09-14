"use client"

import * as React from "react"
import { useNotas } from "../hooks/useNotas"
import { NotasTable } from "./NotasTable"
import { GerarNotaModal } from "./GerarNotaModal"
import { gerarNota, gerarNotasEmLote, marcarNotaEnviada, cancelarNota } from "../notas.repository"
import { downloadNotaFiscalPdf } from "../services/danfse-pdf.service"
import { getCurrentDoctor, getLocalDoctorCache } from "@/features/auth/auth.repository"
import type { GerarNotasLoteInput, NotaFiscal } from "../types"
import { CheckCircle2, AlertCircle } from "lucide-react"

export function NotasPageContent() {
  const { notas, isLoading, error, ambiente, refetch, addOptimisticNotas, updateNota } = useNotas()
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [toast, setToast] = React.useState<{ text: string; success: boolean } | null>(null)

  const handleGerarNotaSubmit = async (data: GerarNotasLoteInput) => {
    // 1. Fecha o modal imediatamente para liberar o usuário
    setIsModalOpen(false)

    // 2. Insere notas otimistas na tabela com status "processando" sem refresh
    const optimisticItems = data.pacientes.map((p, idx) => {
      const tempId = `temp-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`
      const notaOtimista: NotaFiscal = {
        id: tempId,
        medico_id: "",
        clinica_nome: "-",
        numero_rps: "...",
        numero_nfse: "Emitindo...",
        tomador_nome: p.nome,
        tomador_cpf: p.cpf,
        valor_servico: data.valor_servico,
        data_competencia: data.data_emissao || new Date().toISOString().split("T")[0],
        data_emissao: data.data_emissao || new Date().toISOString().split("T")[0],
        status: "processando",
        codigo_verificacao: "...",
        ambiente,
        executada_por: "manual",
        status_envio: "nao_enviado",
      }
      return { tempId, paciente: p, nota: notaOtimista }
    })

    addOptimisticNotas(optimisticItems.map((item) => item.nota))

    setToast({
      text:
        optimisticItems.length > 1
          ? `Iniciando emissão de ${optimisticItems.length} notas em segundo plano...`
          : `Iniciando emissão da nota para ${data.pacientes[0]?.nome}...`,
      success: true,
    })

    // 3. Execução assíncrona em background sem travar a interface nem novo clique em gerar nota
    ;(async () => {
      try {
        if (optimisticItems.length === 1) {
          const item = optimisticItems[0]
          const result = await gerarNota({
            paciente_id: item.paciente.id && !item.paciente.id.startsWith("pac-") ? item.paciente.id : undefined,
            tomador_nome: item.paciente.nome,
            tomador_cpf: item.paciente.cpf,
            valor_servico: data.valor_servico,
            data_emissao: data.data_emissao,
            discriminacao: data.discriminacao,
            descricao_adicional: data.descricao_adicional,
            ambiente,
          })

          if (result.success && result.nota) {
            updateNota(item.tempId, {
              ...result.nota,
              status: "autorizada",
            })
            setToast({
              text: `NFS-e #${result.nota.numero_nfse || result.nota.numero_rps} emitida e salva com sucesso!`,
              success: true,
            })
            // Sincroniza estado final com o Supabase
            refetch()
          } else {
            updateNota(item.tempId, {
              status: "erro",
              numero_nfse: "Falha",
            })
            setToast({
              text: result.message || "Falha ao emitir NFS-e.",
              success: false,
            })
          }
        } else {
          // Lote
          const result = await gerarNotasEmLote({ ...data, ambiente })
          if (result.sucessos > 0) {
            refetch()
            setToast({
              text: `${result.sucessos} de ${result.total} notas emitidas com sucesso!`,
              success: true,
            })
          } else {
            refetch()
            setToast({
              text: `Erro na emissão em lote: ${result.erros[0] || "Falha inesperada"}`,
              success: false,
            })
          }
        }
      } catch (err) {
        console.error("[NotasPage] Erro ao emitir notas em lote/background:", err)
        optimisticItems.forEach((item) => {
          updateNota(item.tempId, { status: "erro", numero_nfse: "Falha" })
        })
        setToast({ text: "Erro inesperado ao processar NFS-e.", success: false })
      } finally {
        setTimeout(() => setToast(null), 5000)
      }
    })()
  }

  const handleDownloadNota = async (nota: NotaFiscal) => {
    try {
      // Se a nota já possui URL pública no Supabase Storage ou Focus NFe e é válida
      if (nota.pdf_url && nota.pdf_url.startsWith("http") && !nota.pdf_url.includes("chave=")) {
        window.open(nota.pdf_url, "_blank")
        setToast({
          text: `Abrindo PDF da NFS-e #${nota.numero_nfse || nota.numero_rps}...`,
          success: true,
        })
        return
      }

      const doctor = (await getCurrentDoctor()) || getLocalDoctorCache()
      downloadNotaFiscalPdf(nota, doctor)
      setToast({
        text: `Download da NFS-e #${nota.numero_nfse || nota.numero_rps} iniciado!`,
        success: true,
      })
    } catch {
      setToast({ text: "Falha ao processar o PDF da nota fiscal.", success: false })
    } finally {
      setTimeout(() => setToast(null), 4000)
    }
  }

  const handleEnviarNota = async (notaId: string) => {
    try {
      const result = await marcarNotaEnviada(notaId)
      setToast({
        text: result.message || "Nota fiscal enviada ao paciente com sucesso!",
        success: result.success,
      })
      if (result.success) {
        refetch()
      }
    } catch {
      setToast({ text: "Falha ao enviar nota fiscal.", success: false })
    } finally {
      setTimeout(() => setToast(null), 4500)
    }
  }

  const handleCancelarNota = async (notaId: string) => {
    try {
      const result = await cancelarNota(
        notaId,
        "Cancelamento solicitado pelo prestador do serviço médico"
      )
      setToast({
        text: result.message || (result.success ? "Nota fiscal cancelada com sucesso!" : "Falha ao cancelar nota."),
        success: result.success,
      })
      if (result.success) {
        refetch()
      }
    } catch {
      setToast({ text: "Falha ao cancelar nota fiscal.", success: false })
    } finally {
      setTimeout(() => setToast(null), 4500)
    }
  }

  return (
    <div className="relative w-full">
      {/* Toast Notificação */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3 text-xs text-foreground shadow-xl animate-in fade-in-0 slide-in-from-bottom-3 duration-200">
          {toast.success ? (
            <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
          ) : (
            <AlertCircle className="size-4 text-red-500 shrink-0" />
          )}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Alerta de erro */}
      {error && (
        <div className="mb-4 mx-auto w-[80%] flex items-center gap-2 rounded-md border border-destructive/20 bg-destructive/10 px-4 py-3 text-xs text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <NotasTable
        notas={notas}
        isLoading={isLoading}
        ambiente={ambiente}
        onGerarNota={() => setIsModalOpen(true)}
        onRefetch={refetch}
        onEnviarNota={handleEnviarNota}
        onCancelarNota={handleCancelarNota}
        onDownloadNota={handleDownloadNota}
      />

      <GerarNotaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleGerarNotaSubmit}
        ambiente={ambiente}
      />
    </div>
  )
}
