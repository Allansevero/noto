import { supabase } from "@/lib/supabase/client"
import type { ConnectTokenResponse, SyncAccountsResponse } from "../types"

/**
 * Solicita um Connect Token temporário (30 minutos) ao backend Next.js
 * para inicializar o widget seguro do Pluggy Connect no navegador.
 */
export async function getPluggyConnectToken(
  medicoId?: string,
  connectorId?: number
): Promise<ConnectTokenResponse> {
  try {
    const { data: sessionData } = await supabase.auth.getSession()
    const token = sessionData?.session?.access_token

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }
    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }

    const response = await fetch("/api/pluggy/token", {
      method: "POST",
      headers,
      body: JSON.stringify({
        medicoId: medicoId || "medico-demo",
        connectorId: connectorId || undefined,
      }),
    })

    const data = await response.json().catch(() => null)

    if (!response.ok || !data?.success) {
      return {
        success: false,
        error: data?.error || `Falha ao obter token do Pluggy (${response.status}).`,
      }
    }

    return {
      success: true,
      connectToken: data.connectToken,
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erro ao conectar com servidor.",
    }
  }
}

/**
 * Envia o itemId gerado pelo Pluggy Connect para que o backend consulte
 * as contas bancárias e as salve no Supabase.
 */
export async function syncPluggyAccounts(
  medicoId: string,
  itemId: string
): Promise<SyncAccountsResponse> {
  try {
    const { data: sessionData } = await supabase.auth.getSession()
    const token = sessionData?.session?.access_token

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }
    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }

    const response = await fetch("/api/pluggy/sync-accounts", {
      method: "POST",
      headers,
      body: JSON.stringify({ medicoId, itemId }),
    })

    const data = await response.json().catch(() => null)

    if (!response.ok || !data?.success) {
      return {
        success: false,
        contas: [],
        error: data?.error || `Erro ao sincronizar contas bancárias (${response.status}).`,
      }
    }

    return {
      success: true,
      contas: data.contas || [],
    }
  } catch (err) {
    return {
      success: false,
      contas: [],
      error: err instanceof Error ? err.message : "Erro de conexão ao sincronizar contas.",
    }
  }
}
