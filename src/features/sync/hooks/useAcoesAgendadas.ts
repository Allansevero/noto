"use client"

import { useState, useEffect, useCallback } from "react"
import { getCurrentDoctor } from "@/features/auth/auth.repository"
import { getSyncStats, listSyncLogs } from "../sync.repository"
import type { SyncStats, NotoSyncLog } from "../types"

export function useAcoesAgendadas() {
  const [stats, setStats] = useState<SyncStats | null>(null)
  const [logs, setLogs] = useState<NotoSyncLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isRegisteringWebhook, setIsRegisteringWebhook] = useState(false)

  const carregarDados = useCallback(async () => {
    setIsLoading(true)
    try {
      const doc = await getCurrentDoctor()
      if (doc?.id) {
        const [statsData, logsData] = await Promise.all([
          getSyncStats(doc.id),
          listSyncLogs(doc.id, 20),
        ])
        setStats(statsData)
        setLogs(logsData)
      }
    } catch (err) {
      console.error("[useAcoesAgendadas] Erro ao carregar dados:", err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    carregarDados()
  }, [carregarDados])

  const executarSincronizacao = async (): Promise<{ success: boolean; message: string }> => {
    if (isSyncing) return { success: false, message: "Varredura já em andamento." }
    setIsSyncing(true)
    try {
      const doc = await getCurrentDoctor()
      const res = await fetch("/api/cron/conciliacao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          medicoId: doc?.id,
          origem: "manual",
        }),
      })

      const data = await res.json()
      if (res.ok && data?.success) {
        await carregarDados()
        return {
          success: true,
          message: data.mensagem || (data.notasEmitidas > 0 ? `${data.notasEmitidas} nota(s) emitida(s)!` : "Varredura concluída. Nenhuma nova transação."),
        }
      } else {
        return {
          success: false,
          message: data?.error || "Erro ao executar varredura bancária.",
        }
      }
    } catch (err) {
      console.error("[useAcoesAgendadas] Erro na sincronização manual:", err)
      return {
        success: false,
        message: "Falha ao comunicar com o serviço de conciliação.",
      }
    } finally {
      setIsSyncing(false)
    }
  }

  const configurarWebhook = async (): Promise<{ success: boolean; message: string }> => {
    if (isRegisteringWebhook) return { success: false, message: "Operação em andamento." }
    setIsRegisteringWebhook(true)
    try {
      const res = await fetch("/api/pluggy/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      const data = await res.json()
      if (res.ok && data?.success) {
        await carregarDados()
        return {
          success: true,
          message: data.message || "Webhook Pluggy configurado com sucesso!",
        }
      } else {
        return {
          success: false,
          message: data?.message || data?.error || "Falha ao registrar webhook na Pluggy.",
        }
      }
    } catch (err) {
      console.error("[useAcoesAgendadas] Erro ao registrar webhook:", err)
      return {
        success: false,
        message: "Erro ao conectar com a Pluggy.",
      }
    } finally {
      setIsRegisteringWebhook(false)
    }
  }

  return {
    stats,
    logs,
    isLoading,
    isSyncing,
    isRegisteringWebhook,
    recarregar: carregarDados,
    executarSincronizacao,
    configurarWebhook,
  }
}

