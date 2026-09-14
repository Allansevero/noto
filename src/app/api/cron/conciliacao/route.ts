import { NextRequest, NextResponse } from "next/server"
import { getServerSupabaseClient } from "@/lib/supabase/server"
import { processarConciliacao } from "@/features/sync/services/conciliacao.service"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  return handleConciliacao(request, "cron")
}

export async function POST(request: NextRequest) {
  return handleConciliacao(request, "manual")
}

async function handleConciliacao(request: NextRequest, defaultOrigem: "cron" | "manual") {
  try {
    const searchParams = request.nextUrl.searchParams
    const paramMedicoId = searchParams.get("medicoId")
    const authHeader = request.headers.get("authorization") || ""

    let bodyMedicoId: string | undefined
    let bodyOrigem: any

    if (request.method === "POST") {
      const body = await request.json().catch(() => ({}))
      bodyMedicoId = body.medicoId
      bodyOrigem = body.origem
    }

    const supabase = getServerSupabaseClient(authHeader)

    // Determina o médico alvo
    let targetMedicoId = paramMedicoId || bodyMedicoId

    if (!targetMedicoId && authHeader) {
      const { data: userData } = await supabase.auth.getUser()
      if (userData?.user?.id) {
        const { data: mData } = await supabase
          .from("medicos")
          .select("id")
          .eq("owner_user_id", userData.user.id)
          .maybeSingle()
        if (mData?.id) {
          targetMedicoId = mData.id
        }
      }
    }

    // Busca contas bancárias ativas
    let query = supabase
      .from("medico_contas_bancarias")
      .select("id, medico_id, pluggy_account_id, pluggy_item_id, banco_nome")
      .eq("ativa_para_recebimento", true)

    if (targetMedicoId) {
      query = query.eq("medico_id", targetMedicoId)
    }

    const { data: contas, error: errContas } = await query

    if (errContas) {
      return NextResponse.json(
        { success: false, error: errContas.message },
        { status: 500 }
      )
    }

    if (!contas || contas.length === 0) {
      return NextResponse.json({
        success: true,
        contasProcessadas: 0,
        transacoesAnalisadas: 0,
        notasEmitidas: 0,
        mensagem: "Nenhuma conta bancária ativa configurada para monitoramento.",
      })
    }

    const origem = bodyOrigem || defaultOrigem
    let totalAnalisadas = 0
    let totalEmitidas = 0
    const relatorios = []

    for (const conta of contas) {
      const res = await processarConciliacao({
        medicoId: conta.medico_id,
        accountId: conta.pluggy_account_id,
        itemId: conta.pluggy_item_id,
        origem,
      })

      totalAnalisadas += res.transacoesAnalisadas
      totalEmitidas += res.notasEmitidas
      relatorios.push({
        banco: conta.banco_nome,
        ...res,
      })
    }

    return NextResponse.json({
      success: true,
      contasProcessadas: contas.length,
      transacoesAnalisadas: totalAnalisadas,
      notasEmitidas: totalEmitidas,
      mensagem:
        totalEmitidas > 0
          ? `Varredura concluída com sucesso: ${totalEmitidas} nota(s) emitida(s)!`
          : `Varredura concluída. Nenhuma nova transação pendente entre ${totalAnalisadas} analisadas.`,
      relatorios,
    })
  } catch (err: unknown) {
    console.error("[API Cron Conciliacao] Erro geral:", err)
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Erro interno ao executar conciliação.",
      },
      { status: 500 }
    )
  }
}
