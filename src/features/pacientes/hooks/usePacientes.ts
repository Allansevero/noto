"use client"

import * as React from "react"
import { listPacientes } from "../pacientes.repository"
import type { Paciente } from "../types"

export function usePacientes() {
  const [pacientes, setPacientes] = React.useState<Paciente[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [includeArchived, setIncludeArchived] = React.useState(false)

  const fetchPacientes = React.useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await listPacientes(includeArchived)
      setPacientes(data)
    } catch (err) {
      console.error("[usePacientes] Erro ao carregar pacientes:", err)
      setError("Não foi possível carregar a lista de pacientes.")
    } finally {
      setIsLoading(false)
    }
  }, [includeArchived])

  React.useEffect(() => {
    fetchPacientes()
  }, [fetchPacientes])

  const addOptimisticPaciente = (paciente: Paciente) => {
    setPacientes((prev) => [paciente, ...prev])
  }

  const updateOptimisticPaciente = (id: string, updates: Partial<Paciente>) => {
    setPacientes((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    )
  }

  const removeOptimisticPaciente = (id: string) => {
    setPacientes((prev) => prev.filter((p) => p.id !== id))
  }

  return {
    pacientes,
    isLoading,
    error,
    includeArchived,
    setIncludeArchived,
    refetch: fetchPacientes,
    addOptimisticPaciente,
    updateOptimisticPaciente,
    removeOptimisticPaciente,
  }
}
