/**
 * Serviço para gerenciamento de webhooks na API do Pluggy Open Finance.
 */

function getPluggyCredentials() {
  const clientId = (process.env.PLUGGY_CLIENT_ID || "").trim()
  const clientSecret = (process.env.PLUGGY_CLIENT_SECRET || "").trim()
  return { clientId, clientSecret }
}

export async function getPluggyApiKey(): Promise<string> {
  const { clientId, clientSecret } = getPluggyCredentials()
  if (!clientId || !clientSecret) {
    throw new Error("Credenciais da Pluggy (PLUGGY_CLIENT_ID / PLUGGY_CLIENT_SECRET) não configuradas.")
  }

  const res = await fetch("https://api.pluggy.ai/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clientId, clientSecret }),
  })

  const data = await res.json().catch(() => null)
  if (!res.ok || !data?.apiKey) {
    throw new Error(data?.message || `Erro ao autenticar com a Pluggy (Status ${res.status}).`)
  }

  return data.apiKey
}

export interface PluggyWebhook {
  id: string
  url: string
  event: string
  createdAt?: string
  updatedAt?: string
  disabledAt?: string | null
}

/**
 * Lista todos os webhooks cadastrados na conta da Pluggy.
 */
export async function listPluggyWebhooks(): Promise<PluggyWebhook[]> {
  try {
    const apiKey = await getPluggyApiKey()
    const res = await fetch("https://api.pluggy.ai/webhooks", {
      headers: { "X-API-KEY": apiKey },
    })

    const data = await res.json().catch(() => null)
    if (!res.ok || !data?.results) {
      console.warn("[PluggyWebhookService] Erro ao listar webhooks:", data)
      return []
    }

    return data.results as PluggyWebhook[]
  } catch (err) {
    console.error("[PluggyWebhookService] Falha ao consultar webhooks:", err)
    return []
  }
}

/**
 * Registra ou atualiza o webhook do NotoMed na Pluggy para os eventos de transações.
 */
export async function registerPluggyWebhook(
  targetUrl: string,
  event: string = "transactions/created"
): Promise<{ success: boolean; webhook?: PluggyWebhook; message?: string }> {
  try {
    const apiKey = await getPluggyApiKey()

    // 1. Verifica se já existe webhook para a mesma URL e evento
    const existing = await listPluggyWebhooks()
    const found = existing.find((w) => w.url === targetUrl && w.event === event)
    if (found) {
      return {
        success: true,
        webhook: found,
        message: `Webhook "${event}" já está ativo na URL informada.`,
      }
    }

    // 2. Cria novo webhook
    const createRes = await fetch("https://api.pluggy.ai/webhooks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
      body: JSON.stringify({
        event,
        url: targetUrl,
      }),
    })

    const result = await createRes.json().catch(() => null)
    if (!createRes.ok || !result?.id) {
      return {
        success: false,
        message: result?.message || `Erro ao registrar webhook na Pluggy (Status ${createRes.status}).`,
      }
    }

    return {
      success: true,
      webhook: result as PluggyWebhook,
      message: `Webhook "${event}" configurado com sucesso na Pluggy!`,
    }
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Erro inesperado ao registrar webhook.",
    }
  }
}
