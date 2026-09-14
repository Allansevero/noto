import { NextRequest, NextResponse } from "next/server"
import { getServerSupabaseClient } from "@/lib/supabase/server"
import { processarConciliacao } from "@/features/sync/services/conciliacao.service"

export const dynamic = "force-dynamic"

/**
 * Health check / Verificação de URL para a Pluggy
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "NotoMed Pluggy Webhook Receptor",
    timestamp: new Date().toISOString(),
  })
}

/**
 * Endpoint Receptor do Webhook da Pluggy
 * Recebe eventos como 'transactions/created', 'item/updated', etc.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const event = body.event || body.type
    const itemId = body.itemId || body.item?.id
    const accountId = body.data?.accountId || body.accountId

    console.log(`[Webhook Pluggy] Notificação recebida! Evento: ${event}, Item: ${itemId}, Account: ${accountId}`)

    if (!itemId && !accountId) {
      return NextResponse.json(
        { success: false, error: "Payload do webhook sem identificador de conta ou item." },
        { status: 400 }
      )
    }

    const supabase = getServerSupabaseClient()

    // 1. Localiza a conta bancária e o médico correspondente no NotoMed
    let query = supabase
      .from("medico_contas_bancarias")
      .select("id, medico_id, pluggy_account_id, pluggy_item_id, ativa_para_recebimento")
      .eq("ativa_para_recebimento", true)

    if (accountId) {
      query = query.eq("pluggy_account_id", accountId)
    } else if (itemId) {
      query = query.eq("pluggy_item_id", itemId)
    }

    const { data: contas, error: errConta } = await query

    if (errConta || !contas || contas.length === 0) {
      console.warn(`[Webhook Pluggy] Nenhuma conta ativa encontrada para accountId=${accountId} ou itemId=${itemId}`)
      return NextResponse.json({
        received: true,
        processed: false,
        message: "Conta bancária não localizada ou desativada para recebimento automático.",
      })
    }

    // 2. Executa a rotina de conciliação para cada conta encontrada
    const relatorios = []
    for (const conta of contas) {
      const res = await processarConciliacao({
        medicoId: conta.medico_id,
        accountId: conta.pluggy_account_id,
        itemId: conta.pluggy_item_id,
        origem: "webhook",
      })
      relatorios.push(res)
    }

    return NextResponse.json({
      received: true,
      processed: true,
      event,
      resultados: relatorios,
    })
  } catch (err: unknown) {
    console.error("[Webhook Pluggy] Erro ao processar payload:", err)
    return NextResponse.json(
      {
        received: false,
        error: err instanceof Error ? err.message : "Erro interno ao processar webhook.",
      },
      { status: 500 }
    )
  }
}
