"use client"

import { useState, useEffect, useCallback } from "react"
import { getPluggyConnectToken, syncPluggyAccounts } from "../services/pluggyClient.service"
import type { ContaBancaria } from "../types"

declare global {
  interface Window {
    PluggyConnect?: any
  }
}

interface UsePluggyConnectProps {
  medicoId?: string
  onAccountsUpdated?: (contas: ContaBancaria[]) => void
}

export function usePluggyConnect({ medicoId, onAccountsUpdated }: UsePluggyConnectProps) {
  const [isScriptLoaded, setIsScriptLoaded] = useState(false)
  const [isOpening, setIsOpening] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // 1. Carrega o script oficial do Pluggy Connect v2 do CDN
  useEffect(() => {
    if (typeof window === "undefined") return

    if (window.PluggyConnect) {
      setIsScriptLoaded(true)
      return
    }

    const scriptId = "pluggy-connect-cdn-script"
    if (document.getElementById(scriptId)) {
      setIsScriptLoaded(true)
      return
    }

    const script = document.createElement("script")
    script.id = scriptId
    script.src = "https://cdn.pluggy.ai/pluggy-connect/v2.7.0/pluggy-connect.js"
    script.async = true
    script.onload = () => {
      setIsScriptLoaded(true)
    }
    script.onerror = () => {
      setError("Não foi possível carregar o módulo do Pluggy Connect.")
    }

    document.head.appendChild(script)
  }, [])

  // 2. Abre o widget de conexão
  const openPluggyConnect = useCallback(async () => {
    if (!medicoId) {
      setError("Médico não autenticado.")
      return
    }

    setError(null)
    setSuccessMessage(null)
    setIsOpening(true)

    try {
      // Solicita o token de conexão no backend seguro
      const tokenRes = await getPluggyConnectToken(medicoId)
      if (!tokenRes.success || !tokenRes.connectToken) {
        setError(tokenRes.error || "Não foi possível gerar o token de conexão com o banco.")
        setIsOpening(false)
        return
      }

      if (!window.PluggyConnect) {
        setError("O widget da Pluggy ainda está inicializando. Tente novamente em alguns instantes.")
        setIsOpening(false)
        return
      }

      const pluggy = new window.PluggyConnect({
        connectToken: tokenRes.connectToken,
        includeSandbox: true,
        onSuccess: async (data: { item?: { id?: string } }) => {
          const itemId = data?.item?.id
          if (!itemId) {
            setError("Conexão realizada, mas identificador do banco não retornado.")
            return
          }

          setIsSyncing(true)
          setSuccessMessage("Conta bancária conectada! Sincronizando dados com o sistema...")

          const syncRes = await syncPluggyAccounts(medicoId, itemId)
          setIsSyncing(false)

          if (syncRes.success) {
            setSuccessMessage("Conta bancária conectada e sincronizada com sucesso!")
            if (onAccountsUpdated) {
              onAccountsUpdated(syncRes.contas)
            }
          } else {
            setError(syncRes.error || "Falha ao sincronizar contas.")
          }
        },
        onError: (err: any) => {
          console.error("[Pluggy Widget Error]:", err)
          setError(
            err?.message || "Ocorreu um erro durante a autenticação bancária no Pluggy Connect."
          )
        },
        onClose: () => {
          setIsOpening(false)
        },
      })

      pluggy.init()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao abrir conexão bancária.")
    } finally {
      setIsOpening(false)
    }
  }, [medicoId, onAccountsUpdated])

  return {
    isScriptLoaded,
    isOpening,
    isSyncing,
    error,
    successMessage,
    openPluggyConnect,
    setError,
    setSuccessMessage,
  }
}
