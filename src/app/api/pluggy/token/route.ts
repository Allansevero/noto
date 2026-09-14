import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

function getPluggyCredentials() {
  const clientId = (process.env.PLUGGY_CLIENT_ID || "").trim()
  const clientSecret = (process.env.PLUGGY_CLIENT_SECRET || "").trim()
  return { clientId, clientSecret }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const medicoId = body.medicoId || "medico-demo"
    const connectorId = body.connectorId ? Number(body.connectorId) : undefined

    const { clientId, clientSecret } = getPluggyCredentials()
    if (!clientId || !clientSecret) {
      return NextResponse.json(
        {
          success: false,
          error: "Credenciais do Pluggy não configuradas no servidor seguro (.env).",
        },
        { status: 500 }
      )
    }

    // 1. Autentica na API do Pluggy para obter a apiKey temporária
    const authRes = await fetch("https://api.pluggy.ai/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, clientSecret }),
    })

    const authData = await authRes.json().catch(() => null)
    if (!authRes.ok || !authData?.apiKey) {
      const errorMsg =
        authData?.message || `Falha na autenticação com Pluggy (Status ${authRes.status}).`
      return NextResponse.json(
        { success: false, error: errorMsg, detalhes: authData },
        { status: authRes.status || 500 }
      )
    }

    const apiKey = authData.apiKey

    // 2. Monta opções do Connect Token
    const connectOptions: Record<string, any> = {
      includeSandbox: true,
    }
    if (connectorId && !isNaN(connectorId)) {
      connectOptions.connectorId = connectorId
    }

    // 3. Gera o Connect Token com escopo restrito para o widget
    const tokenRes = await fetch("https://api.pluggy.ai/connect_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
      body: JSON.stringify({
        clientUserId: medicoId,
        options: connectOptions,
      }),
    })

    const tokenData = await tokenRes.json().catch(() => null)
    if (!tokenRes.ok || !tokenData?.accessToken) {
      const errorMsg =
        tokenData?.message || `Falha ao gerar Connect Token (Status ${tokenRes.status}).`
      return NextResponse.json(
        { success: false, error: errorMsg, detalhes: tokenData },
        { status: tokenRes.status || 500 }
      )
    }

    return NextResponse.json({
      success: true,
      connectToken: tokenData.accessToken,
    })
  } catch (err: unknown) {
    console.error("[API Pluggy Token] Erro interno:", err)
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Erro interno ao gerar token do Pluggy.",
      },
      { status: 500 }
    )
  }
}
