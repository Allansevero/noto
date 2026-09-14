"use client"

import * as React from "react"
import { CheckCircle2, AlertCircle } from "lucide-react"
import { usePacientes } from "../hooks/usePacientes"
import { PacientesTable } from "./PacientesTable"
import { PacienteFormDialog } from "./PacienteFormDialog"
import { PacienteNotasHistoryDialog } from "./PacienteNotasHistoryDialog"
import {
  criarPaciente,
  atualizarPaciente,
  arquivarPaciente,
} from "../pacientes.repository"
import type { Paciente, CriarPacienteInput, AtualizarPacienteInput } from "../types"

export function PacientesPageContent() {
  const {
    pacientes,
    isLoading,
    error,
    refetch,
    addOptimisticPaciente,
    updateOptimisticPaciente,
    removeOptimisticPaciente,
  } = usePacientes()

  // Modais
  const [isFormOpen, setIsFormOpen] = React.useState(false)
  const [editingPaciente, setEditingPaciente] = React.useState<Paciente | null>(null)

  const [isHistoryOpen, setIsHistoryOpen] = React.useState(false)
  const [historyPaciente, setHistoryPaciente] = React.useState<Paciente | null>(null)

  // Toast
  const [toast, setToast] = React.useState<{ text: string; success: boolean } | null>(null)

  const showToast = (text: string, success = true) => {
    setToast({ text, success })
    setTimeout(() => setToast(null), 4000)
  }

  // Abertura para novo paciente
  const handleNovoPaciente = () => {
    setEditingPaciente(null)
    setIsFormOpen(true)
  }

  // Abertura para editar paciente
  const handleEditarPaciente = (paciente: Paciente) => {
    setEditingPaciente(paciente)
    setIsFormOpen(true)
  }

  // Abertura para ver histórico de notas (ScrollText)
  const handleVerHistoricoNotas = (paciente: Paciente) => {
    setHistoryPaciente(paciente)
    setIsHistoryOpen(true)
  }

  // Salvar paciente (criação ou edição)
  const handleSavePaciente = async (
    dados: CriarPacienteInput | AtualizarPacienteInput,
    id?: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (id) {
      // Modo Edição
      const res = await atualizarPaciente(id, dados as AtualizarPacienteInput)
      if (res.success) {
        updateOptimisticPaciente(id, dados)
        showToast("Dados do paciente atualizados com sucesso!")
        refetch()
        return { success: true }
      }
      return { success: false, error: res.error }
    } else {
      // Modo Criação
      const res = await criarPaciente(dados as CriarPacienteInput)
      if (res.success && res.paciente) {
        addOptimisticPaciente(res.paciente)
        showToast(`Paciente ${res.paciente.nome} cadastrado com sucesso!`)
        refetch()
        return { success: true }
      }
      return { success: false, error: res.error }
    }
  }

  // Arquivar paciente
  const handleArquivarPaciente = async (pacienteId: string) => {
    // Atualização otimista: remove ou marca arquivado
    updateOptimisticPaciente(pacienteId, { arquivado: true })
    showToast("Paciente arquivado com sucesso!")

    try {
      const res = await arquivarPaciente(pacienteId, true)
      if (!res.success) {
        refetch()
        showToast(res.error || "Erro ao arquivar paciente.", false)
      } else {
        refetch()
      }
    } catch {
      refetch()
      showToast("Erro inesperado ao arquivar paciente.", false)
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

      {/* Tabela de Pacientes */}
      <PacientesTable
        pacientes={pacientes}
        isLoading={isLoading}
        onNovoPaciente={handleNovoPaciente}
        onEditarPaciente={handleEditarPaciente}
        onVerHistoricoNotas={handleVerHistoricoNotas}
        onArquivarPaciente={handleArquivarPaciente}
        onRefetch={refetch}
      />

      {/* Dialog de Cadastro e Edição de Paciente */}
      <PacienteFormDialog
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        paciente={editingPaciente}
        onSave={handleSavePaciente}
      />

      {/* Dialog de Histórico de Notas (ScrollText) */}
      <PacienteNotasHistoryDialog
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        paciente={historyPaciente}
      />
    </div>
  )
}
