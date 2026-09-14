import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { PACIENTE_ONBOARDING_TESTE } from "@/config/constants"

export const dynamic = "force-dynamic"

function getPluggyCredentials() {
  const clientId = (process.env.PLUGGY_CLIENT_ID || "").trim()
  const clientSecret = (process.env.PLUGGY_CLIENT_SECRET || "").trim()
  return { clientId, clientSecret }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { medicoId, itemId } = body

    if (!medicoId || !itemId) {
      return NextResponse.json(
        { success: false, error: "Parâmetros medicoId e itemId são obrigatórios." },
        { status: 400 }
      )
    }

    const { clientId, clientSecret } = getPluggyCredentials()
    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { success: false, error: "Credenciais do Pluggy não configuradas no servidor." },
        { status: 500 }
      )
    }

    // 1. Obtém apiKey da Pluggy
    const authRes = await fetch("https://api.pluggy.ai/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, clientSecret }),
    })

    const authData = await authRes.json().catch(() => null)
    if (!authRes.ok || !authData?.apiKey) {
      return NextResponse.json(
        { success: false, error: "Falha na autenticação com Pluggy." },
        { status: 500 }
      )
    }

    const apiKey = authData.apiKey

    // 2. Busca informações do item/conector (banco)
    let bancoNome = "Banco Conectado"
    let bancoCodigo = ""

    const itemRes = await fetch(`https://api.pluggy.ai/items/${itemId}`, {
      headers: { "X-API-KEY": apiKey },
    })
    const itemData = await itemRes.json().catch(() => null)
    if (itemData?.connector) {
      bancoNome = itemData.connector.name || bancoNome
      bancoCodigo = String(itemData.connector.id || "")
    }

    // 3. Busca contas associadas a este item
    const accountsRes = await fetch(`https://api.pluggy.ai/accounts?itemId=${itemId}`, {
      headers: { "X-API-KEY": apiKey },
    })

    const accountsData = await accountsRes.json().catch(() => null)
    if (!accountsRes.ok || !accountsData?.results) {
      const errorMsg =
        accountsData?.message || `Falha ao buscar contas no Pluggy (Status ${accountsRes.status}).`
      return NextResponse.json(
        { success: false, error: errorMsg, detalhes: accountsData },
        { status: accountsRes.status || 500 }
      )
    }

    const rawAccounts = accountsData.results || []

    // 4. Inicializa Supabase Client para salvar no banco
    const authHeaderFromReq = request.headers.get("authorization") || ""
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://nzihhuvbwbidjwmmbfjr.supabase.co"
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: authHeaderFromReq ? { Authorization: authHeaderFromReq } : {},
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })

    // 5. Salva cada conta no Supabase usando RPC fn_salvar_conta_bancaria_pluggy
    for (const acc of rawAccounts) {
      await supabaseClient.rpc("fn_salvar_conta_bancaria_pluggy", {
        p_medico_id: medicoId,
        p_pluggy_item_id: itemId,
        p_pluggy_account_id: String(acc.id),
        p_banco_codigo: bancoCodigo || null,
        p_banco_nome: bancoNome || acc.name || "Conta Bancária",
        p_agencia: acc.agency || null,
        p_numero_conta: acc.number || "00000",
        p_tipo_conta: acc.subtype || acc.type || "CHECKING",
        p_saldo: typeof acc.balance === "number" ? acc.balance : 0.0,
        p_moeda: acc.currencyCode || "BRL",
      })
    }

    // 5.1 Garante a criação do paciente de teste 'Allan Miranda Severo Rodrigues' com valor de R$ 0,01
    try {
      const targetName = PACIENTE_ONBOARDING_TESTE.nome
      const targetDoc = PACIENTE_ONBOARDING_TESTE.cnpj

      const { data: listPac } = await supabaseClient
        .from("pacientes")
        .select("id, nome, cpf, valor_consulta")
        .eq("medico_id", medicoId)

      const existingPac = listPac?.find(
        (p) =>
          p.cpf === targetDoc ||
          Number(p.valor_consulta) === 0.01 ||
          (p.nome && p.nome.toLowerCase().includes("allan")) ||
          (p.nome && p.nome.toLowerCase().includes("33 841 732"))
      )

      if (existingPac?.id) {
        await supabaseClient
          .from("pacientes")
          .update({
            nome: targetName,
            cpf: targetDoc,
            valor_consulta: 0.01,
            arquivado: false,
          })
          .eq("id", existingPac.id)
      } else {
        await supabaseClient
          .from("pacientes")
          .insert({
            medico_id: medicoId,
            nome: targetName,
            cpf: targetDoc,
            email: "severoallan2019@gmail.com",
            valor_consulta: 0.01,
            arquivado: false,
          })
      }
    } catch (errPac) {
      console.warn("[API Pluggy Sync] Aviso ao criar paciente de teste:", errPac)
    }

    // 6. Consulta todas as contas salvas do médico
    const { data: savedAccounts } = await supabaseClient
      .from("medico_contas_bancarias")
      .select("*")
      .eq("medico_id", medicoId)
      .order("criado_em", { ascending: false })

    return NextResponse.json({
      success: true,
      contas: savedAccounts || [],
      mensagem: `${rawAccounts.length} conta(s) sincronizada(s) com sucesso via Pluggy Open Finance!`,
    })
  } catch (err: unknown) {
    console.error("[API Pluggy Sync] Erro interno:", err)
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Erro interno ao sincronizar contas bancárias.",
      },
      { status: 500 }
    )
  }
}
