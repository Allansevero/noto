"use client"

import * as React from "react"
import { listNotas } from "../notas.repository"
import type { NotaFiscal, AmbienteFiscal } from "../types"
import { useEnvironment } from "@/context/environment-context"

interface UseNotasReturn {
  notas: NotaFiscal[]
  total: number
  isLoading: boolean
  error: string | null
  ambiente: AmbienteFiscal
  isSandbox: boolean
  refetch: () => void
  addOptimisticNotas: (novasNotas: NotaFiscal[]) => void
  updateNota: (idOuTempId: string, updates: Partial<NotaFiscal>) => void
}

export function useNotas(): UseNotasReturn {
  const { ambiente, isSandbox } = useEnvironment()
  const [notas, setNotas] = React.useState<NotaFiscal[]>([])
  const [total, setTotal] = React.useState(0)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [tick, setTick] = React.useState(0)

  React.useEffect(() => {
    let mounted = true
    setIsLoading(true)
    listNotas({ ambiente })
      .then((result) => {
        if (!mounted) return
        setNotas(result.data)
        setTotal(result.total)
        setError(null)
      })
      .catch((err: unknown) => {
        if (!mounted) return
        setError(err instanceof Error ? err.message : "Erro ao carregar notas.")
      })
      .finally(() => {
        if (mounted) setIsLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [ambiente, tick])

  // Adiciona notas otimistas imediatamente no início da tabela
  const addOptimisticNotas = React.useCallback((novasNotas: NotaFiscal[]) => {
    setNotas((prev) => [...novasNotas, ...prev])
    setTotal((prev) => prev + novasNotas.length)
  }, [])

  // Atualiza uma nota pelo seu ID ou tempId
  const updateNota = React.useCallback((idOuTempId: string, updates: Partial<NotaFiscal>) => {
    setNotas((prev) =>
      prev.map((n) => (n.id === idOuTempId ? { ...n, ...updates } : n))
    )
  }, [])

  return {
    notas,
    total,
    isLoading,
    error,
    ambiente,
    isSandbox,
    refetch: () => setTick((t) => t + 1),
    addOptimisticNotas,
    updateNota,
  }
}
