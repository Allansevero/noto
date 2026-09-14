import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

/**
 * Edge Function: poll-payment
 *
 * Invocada pelo cliente (via supabase.functions.invoke) quando o usuário
 * está na Etapa 3 do onboarding com uma conta bancária já conectada.
 *
 * Fluxo:
 * 1. Recebe { medicoId, accountId, minDate? }
 * 2. Autentica na Pluggy e busca transações da conta
 * 3. Verifica se há crédito de R$ 0,01 do paciente de onboarding
 * 4. Atualiza onboarding_payment_polls (status='found' ou 'waiting')
 *    → Supabase Realtime notifica o cliente instantaneamente
 * 5. Retorna { found, transacao? }
 *
 * Não é um Cron Job Vercel — é chamada sob demanda pelo cliente a cada
 * POLL_INTERVAL_MS (padrão 30s definido no hook useOnboardingPaymentPoll).
 */

const PLUGGY_CLIENT_ID = Deno.env.get("PLUGGY_CLIENT_ID") ?? ""
const PLUGGY_CLIENT_SECRET = Deno.env.get("PLUGGY_CLIENT_SECRET") ?? ""
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? ""
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""

// Nomes candidatos do paciente de onboarding (usados na conciliação)
const ONBOARDING_CANDIDATE_NAMES = [
  "Stone Instituicao de Pagamento S.A. (Allan Miranda)",
  "Allan Miranda",
  "Allan Miranda Severo",
  "Allan Severo Rodrigues",
  "Allan Miranda Severo Rodrigues",
]
const ONBOARDING_CANDIDATE_DOC = "16501555000157"
const TARGET_AMOUNT = 0.01

function normalizeCleanText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9\s]/g, " ")
    .toUpperCase()
    .trim()
}

function matchesSender(candidateNames: string[], fullText: string): boolean {
  const normText = normalizeCleanText(fullText)
  if (!normText) return false
  const textTokens = new Set(normText.split(/\s+/).filter(Boolean))
  const ignoredConnectors = new Set(["DE", "DA", "DO", "DOS", "DAS", "E", "LTDA", "SA", "MEI"])

  for (const rawName of candidateNames) {
    if (!rawName) continue
    const normName = normalizeCleanText(rawName)
    const nameWords = normName
      .split(/\s+/)
      .filter((w) => w.length >= 2 && !/^\d+$/.test(w) && !ignoredConnectors.has(w))

    if (nameWords.length === 0) continue

    // Nome completo exato
    if (normText.includes(nameWords.join(" "))) return true

    // 2+ palavras do nome presentes no texto
    const matched = nameWords.filter(
      (w) => textTokens.has(w) || normText.includes(` ${w} `)
    )
    if (matched.length >= 2) return true
  }
  return false
}

async function getPluggyApiKey(): Promise<string | null> {
  if (!PLUGGY_CLIENT_ID || !PLUGGY_CLIENT_SECRET) return null
  const res = await fetch("https://api.pluggy.ai/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clientId: PLUGGY_CLIENT_ID, clientSecret: PLUGGY_CLIENT_SECRET }),
  })
  const data = await res.json().catch(() => null)
  return data?.apiKey ?? null
}

serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    })
  }

  try {
    const body = await req.json().catch(() => ({}))
    const { medicoId, accountId, minDate } = body as {
      medicoId?: string
      accountId?: string
      minDate?: string
    }

    if (!medicoId || !accountId) {
      return new Response(
        JSON.stringify({ found: false, error: "medicoId e accountId são obrigatórios." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    // Cliente service_role para atualizar a tabela sem restrição RLS
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    // Incrementa tentativas e registra timestamp do check
    await supabaseAdmin
      .from("onboarding_payment_polls")
      .update({
        tentativas: supabaseAdmin.rpc ? undefined : undefined, // placeholder — usa SQL abaixo
        ultimo_check_em: new Date().toISOString(),
      })
      .eq("medico_id", medicoId)
      .eq("status", "waiting")

    // Incrementa tentativas via rpc para evitar race condition
    await supabaseAdmin.rpc("fn_increment_poll_tentativas", { p_medico_id: medicoId }).catch(() => {
      // RPC opcional — falha silenciosa se não existir ainda
    })

    // Autentica na Pluggy
    const apiKey = await getPluggyApiKey()
    if (!apiKey) {
      await supabaseAdmin
        .from("onboarding_payment_polls")
        .update({ status: "error", atualizado_em: new Date().toISOString() })
        .eq("medico_id", medicoId)
        .eq("status", "waiting")

      return new Response(
        JSON.stringify({ found: false, error: "Falha na autenticação Pluggy." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      )
    }

    // Busca transações da conta
    const txRes = await fetch(
      `https://api.pluggy.ai/v2/transactions?accountId=${accountId}`,
      { headers: { "X-API-KEY": apiKey } }
    )
    const txData = await txRes.json().catch(() => null)

    if (!txRes.ok || !txData?.results) {
      return new Response(
        JSON.stringify({ found: false, error: "Falha ao buscar transações na Pluggy." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      )
    }

    const transactions: any[] = Array.isArray(txData.results) ? txData.results : []

    // Define data mínima de compliance
    let minAllowedDate: Date | null = null
    if (minDate) {
      const parsed = new Date(minDate)
      if (!isNaN(parsed.getTime())) minAllowedDate = parsed
    }

    // Busca notas já emitidas para evitar duplicação
    const { data: invoicedNotes } = await supabaseAdmin
      .from("notas_fiscais")
      .select("pluggy_transacao_id")
      .eq("medico_id", medicoId)
      .not("pluggy_transacao_id", "is", null)

    const alreadyInvoicedIds = new Set<string>(
      (invoicedNotes ?? []).map((n: any) => n.pluggy_transacao_id).filter(Boolean)
    )

    // Procura transação elegível
    let matchFound: any = null

    for (const t of transactions) {
      const txAmount = Math.abs(Number(t.amount))
      const isTargetValue = Math.abs(txAmount - TARGET_AMOUNT) < 0.001
      const isCredit = t.type === "CREDIT" || Number(t.amount) > 0
      if (!isTargetValue || !isCredit) continue

      // Anti-duplicação
      if (alreadyInvoicedIds.has(t.id)) continue

      // Compliance temporal
      if (minAllowedDate) {
        const txDate = new Date(t.date)
        if (txDate.getTime() < minAllowedDate.getTime() - 60000) continue
      }

      // Conciliação do remetente
      const payerName = t.paymentData?.payer?.name ?? ""
      const payerDoc = (t.paymentData?.payer?.documentNumber?.value ?? "").replace(/\D/g, "")
      const description = t.description ?? ""
      const descRaw = t.descriptionRaw ?? ""
      const fullText = `${description} ${descRaw} ${payerName}`

      const docMatch =
        payerDoc &&
        (payerDoc.includes(ONBOARDING_CANDIDATE_DOC) ||
          ONBOARDING_CANDIDATE_DOC.includes(payerDoc))

      if (docMatch || matchesSender(ONBOARDING_CANDIDATE_NAMES, fullText)) {
        matchFound = t
        break
      }
    }

    if (matchFound) {
      // Atualiza poll para 'found' — Realtime notificará o cliente
      await supabaseAdmin
        .from("onboarding_payment_polls")
        .update({
          status: "found",
          transacao_id: matchFound.id,
          transacao_data: matchFound.date,
          transacao_valor: Math.abs(Number(matchFound.amount)),
          transacao_descricao:
            matchFound.description || "Transferência PIX Recebida",
          atualizado_em: new Date().toISOString(),
        })
        .eq("medico_id", medicoId)
        .eq("status", "waiting")

      return new Response(
        JSON.stringify({
          found: true,
          transacao: {
            id: matchFound.id,
            descricao: matchFound.description || "Transferência PIX Recebida",
            valor: Math.abs(Number(matchFound.amount)),
            data: matchFound.date,
            dataHora: matchFound.createdAt || matchFound.date || new Date().toISOString(),
            tipo: matchFound.type,
            pagador:
              matchFound.paymentData?.payer?.name ||
              matchFound.description ||
              "Remetente Identificado",
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    }

    // Pagamento ainda não identificado — mantém 'waiting'
    return new Response(
      JSON.stringify({
        found: false,
        mensagem: `Aguardando PIX de R$ ${TARGET_AMOUNT.toFixed(2)}. ${transactions.length} transações analisadas.`,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    )
  } catch (err: unknown) {
    console.error("[poll-payment] Erro:", err)
    return new Response(
      JSON.stringify({
        found: false,
        error: err instanceof Error ? err.message : "Erro interno na Edge Function.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
})
