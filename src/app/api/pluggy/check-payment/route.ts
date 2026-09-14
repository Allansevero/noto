import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { PACIENTE_ONBOARDING_TESTE } from "@/config/constants"

export const dynamic = "force-dynamic"

function getPluggyCredentials() {
  const clientId = (process.env.PLUGGY_CLIENT_ID || "").trim()
  const clientSecret = (process.env.PLUGGY_CLIENT_SECRET || "").trim()
  return { clientId, clientSecret }
}

function normalizeCleanText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9\s]/g, " ")
    .toUpperCase()
    .trim()
}

interface NameMatchResult {
  matched: boolean
  level: "exact_full" | "three_parts" | "two_parts" | "single_part" | "none"
  matchedParts: string[]
  reason: string
}

/**
 * Reconhece o remetente do pagamento com suporte a:
 * 1. Nome completo exato
 * 2. Três partes do nome (ex: Allan Miranda Severo / Allan Severo Rodrigues)
 * 3. Duas partes do nome (ex: Allan Rodrigues / Allan Miranda / Severo Rodrigues)
 */
function matchSenderPatientName(
  candidateNames: string[],
  fullText: string
): NameMatchResult {
  const normText = normalizeCleanText(fullText)
  if (!normText) return { matched: false, level: "none", matchedParts: [], reason: "" }

  const textTokens = new Set(normText.split(/\s+/).filter(Boolean))

  const ignoredConnectors = new Set([
    "DE", "DA", "DO", "DOS", "DAS", "E",
    "LTDA", "PARA", "PAGAMENTO", "INSTITUICAO", "S.A.", "SA", "MEI", "EPP", "ME"
  ])

  for (const rawName of candidateNames) {
    if (!rawName) continue
    const normName = normalizeCleanText(rawName)
    // Extrai palavras significativas do nome (removendo números de documento e conectores)
    const nameWords = normName
      .split(/\s+/)
      .filter((w) => w.length >= 2 && !/^\d+$/.test(w) && !ignoredConnectors.has(w))

    if (nameWords.length === 0) continue

    // 1. NOME COMPLETO EXATO
    const fullNameClean = nameWords.join(" ")
    if (normText.includes(fullNameClean)) {
      return {
        matched: true,
        level: "exact_full",
        matchedParts: nameWords,
        reason: `Nome completo exato identificado ("${fullNameClean}")`,
      }
    }

    // Identifica quais partes do nome do paciente constam no texto
    const matchedParts: string[] = []
    for (const word of nameWords) {
      if (
        textTokens.has(word) ||
        normText.includes(` ${word} `) ||
        normText.startsWith(`${word} `) ||
        normText.endsWith(` ${word}`)
      ) {
        matchedParts.push(word)
      }
    }

    // 2. TRÊS PARTES DO NOME (se o nome tiver 3 ou mais palavras)
    if (matchedParts.length >= 3) {
      return {
        matched: true,
        level: "three_parts",
        matchedParts,
        reason: `3 partes do nome identificadas ("${matchedParts.join(" ")}")`,
      }
    }

    if (nameWords.length >= 3) {
      for (let i = 0; i <= nameWords.length - 3; i++) {
        const triplet = `${nameWords[i]} ${nameWords[i + 1]} ${nameWords[i + 2]}`
        if (normText.includes(triplet)) {
          return {
            matched: true,
            level: "three_parts",
            matchedParts: [nameWords[i], nameWords[i + 1], nameWords[i + 2]],
            reason: `3 partes do nome identificadas ("${triplet}")`,
          }
        }
      }
    }

    // 3. DUAS PARTES DO NOME (se o nome tiver 2 ou mais palavras)
    if (matchedParts.length >= 2) {
      return {
        matched: true,
        level: "two_parts",
        matchedParts,
        reason: `2 partes do nome identificadas ("${matchedParts.join(" ")}")`,
      }
    }

    if (nameWords.length >= 2) {
      const firstAndLast = `${nameWords[0]} ${nameWords[nameWords.length - 1]}`
      if (normText.includes(firstAndLast)) {
        return {
          matched: true,
          level: "two_parts",
          matchedParts: [nameWords[0], nameWords[nameWords.length - 1]],
          reason: `2 partes do nome identificadas ("${firstAndLast}")`,
        }
      }
    }

    // 4. Caso o nome original tenha apenas 1 palavra
    if (nameWords.length === 1 && matchedParts.length === 1) {
      return {
        matched: true,
        level: "single_part",
        matchedParts,
        reason: `Nome identificado ("${matchedParts[0]}")`,
      }
    }
  }

  return { matched: false, level: "none", matchedParts: [], reason: "" }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const {
      accountId,
      amount = 0.01,
      pacienteNome,
      pacienteDocumento,
      pagadorSecundarioNome,
      pagadorSecundarioCpf,
      medicoId,
      pacienteId,
      minDate
    } = body
    console.log(`[API check-payment] Requisição recebida. accountId: ${accountId}, amount: ${amount}, pacienteNome: ${pacienteNome}, pacienteDoc: ${pacienteDocumento}, secNome: ${pagadorSecundarioNome}, secDoc: ${pagadorSecundarioCpf}, minDate: ${minDate}`)

    if (!accountId) {
      console.warn("[API check-payment] accountId não informado.")
      return NextResponse.json(
        { pago: false, error: "ID da conta bancária não informado." },
        { status: 400 }
      )
    }

    const { clientId, clientSecret } = getPluggyCredentials()
    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { pago: false, error: "Credenciais do Pluggy não configuradas no servidor." },
        { status: 500 }
      )
    }

    // Inicializa client do Supabase para validações fiscais e anti-duplicação
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

    // Resolve o ID do médico logado se não foi passado no body
    let activeMedicoId = medicoId
    if (!activeMedicoId && authHeaderFromReq) {
      const { data: userData } = await supabaseClient.auth.getUser()
      if (userData?.user?.id) {
        const { data: mData } = await supabaseClient
          .from("medicos")
          .select("id")
          .eq("owner_user_id", userData.user.id)
          .maybeSingle()
        if (mData?.id) activeMedicoId = mData.id
      }
    }

    // 1. Busca transações já faturadas para este médico (Regra 2: Anti-duplicação / Idempotência)
    const alreadyInvoicedTxIds = new Set<string>()
    if (activeMedicoId) {
      const { data: invoicedNotes } = await supabaseClient
        .from("notas_fiscais")
        .select("pluggy_transacao_id")
        .eq("medico_id", activeMedicoId)
        .not("pluggy_transacao_id", "is", null)

      if (invoicedNotes) {
        for (const n of invoicedNotes) {
          if (n.pluggy_transacao_id) {
            alreadyInvoicedTxIds.add(n.pluggy_transacao_id)
          }
        }
      }
    }

    // 2. Busca data limite (Regra 1: Compliance - NUNCA emitir pagamentos anteriores ao cadastro do paciente/médico)
    let minAllowedDate: Date | null = null
    if (minDate) {
      const parsed = new Date(minDate)
      if (!isNaN(parsed.getTime())) {
        minAllowedDate = parsed
      }
    }

    if (!minAllowedDate && (pacienteId || (activeMedicoId && (pacienteDocumento || pacienteNome)))) {
      let query = supabaseClient.from("pacientes").select("criado_em")
      if (pacienteId) {
        query = query.eq("id", pacienteId)
      } else if (activeMedicoId && pacienteDocumento) {
        const cleanDoc = pacienteDocumento.replace(/\D/g, "")
        query = query.eq("medico_id", activeMedicoId).eq("cpf", cleanDoc)
      } else if (activeMedicoId && pacienteNome) {
        query = query.eq("medico_id", activeMedicoId).ilike("nome", `%${pacienteNome}%`)
      }
      const { data: pacienteData } = await query.order("criado_em", { ascending: false }).limit(1).maybeSingle()
      if (pacienteData?.criado_em) {
        minAllowedDate = new Date(pacienteData.criado_em)
      }
    }

    if (!minAllowedDate && activeMedicoId) {
      const { data: docData } = await supabaseClient
        .from("medicos")
        .select("criado_em")
        .eq("id", activeMedicoId)
        .maybeSingle()
      if (docData?.criado_em) {
        minAllowedDate = new Date(docData.criado_em)
      }
    }

    // 3. Obtém apiKey da Pluggy
    const authRes = await fetch("https://api.pluggy.ai/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, clientSecret }),
    })

    const authData = await authRes.json().catch(() => null)
    if (!authRes.ok || !authData?.apiKey) {
      return NextResponse.json(
        { pago: false, error: "Falha na autenticação com a Pluggy." },
        { status: 500 }
      )
    }

    const apiKey = authData.apiKey

    // 4. Busca as transações utilizando a API v2 da Pluggy
    const txRes = await fetch(
      `https://api.pluggy.ai/v2/transactions?accountId=${accountId}`,
      {
        headers: { "X-API-KEY": apiKey },
      }
    )

    const txData = await txRes.json().catch(() => null)
    if (!txRes.ok || !txData?.results) {
      const errorMsg =
        txData?.message || `Falha ao buscar transações na Pluggy (Status ${txRes.status}).`
      return NextResponse.json(
        { pago: false, error: errorMsg, detalhes: txData },
        { status: txRes.status || 500 }
      )
    }

    const transactions = Array.isArray(txData.results) ? txData.results : []
    const targetAmount = Number(amount) || 0.01

    // 5. Monta nomes candidatos do paciente para conciliação do remetente
    const candidateNames: string[] = []
    if (pacienteNome) {
      candidateNames.push(pacienteNome)
    }
    if (pacienteId) {
      const { data: pRow } = await supabaseClient
        .from("pacientes")
        .select("nome")
        .eq("id", pacienteId)
        .maybeSingle()
      if (pRow?.nome) {
        candidateNames.push(pRow.nome)
      }
    }
    // Adiciona o nome do paciente de onboarding como candidato caso aplicável
    if (!candidateNames.includes(PACIENTE_ONBOARDING_TESTE.nome)) {
      candidateNames.push(PACIENTE_ONBOARDING_TESTE.nome)
    }
    if (PACIENTE_ONBOARDING_TESTE.nomeCurto && !candidateNames.includes(PACIENTE_ONBOARDING_TESTE.nomeCurto)) {
      candidateNames.push(PACIENTE_ONBOARDING_TESTE.nomeCurto)
    }

    // Adiciona pagador secundário aos nomes candidatos se fornecido
    if (pagadorSecundarioNome && !candidateNames.includes(pagadorSecundarioNome)) {
      candidateNames.push(pagadorSecundarioNome)
    }

    let docDigits = (pacienteDocumento || "").replace(/\D/g, "")
    if (!docDigits && pacienteId) {
      const { data: pRow } = await supabaseClient
        .from("pacientes")
        .select("cpf")
        .eq("id", pacienteId)
        .maybeSingle()
      if (pRow?.cpf) {
        docDigits = pRow.cpf.replace(/\D/g, "")
      }
    }

    const candidateDocs: string[] = []
    if (docDigits) candidateDocs.push(docDigits)
    const secDocDigits = (pagadorSecundarioCpf || "").replace(/\D/g, "")
    if (secDocDigits) candidateDocs.push(secDocDigits)
    const isProduction = process.env.FOCUS_NFE_ENVIRONMENT === "producao"

    let matchFound: any = null
    let matchReason: string = ""
    let hasSkippedInvoiced = false
    let hasSkippedPriorToPatient = false

    for (const t of transactions) {
      const txAmount = Math.abs(Number(t.amount))
      const isTargetValue = Math.abs(txAmount - targetAmount) < 0.001
      const isCredit = t.type === "CREDIT" || Number(t.amount) > 0

      if (!isTargetValue || !isCredit) {
        continue
      }

      const description = normalizeCleanText(t.description || "")
      const descriptionRaw = normalizeCleanText(t.descriptionRaw || "")
      const payerName = normalizeCleanText(t.paymentData?.payer?.name || "")
      const payerDoc = (t.paymentData?.payer?.documentNumber?.value || "").replace(/\D/g, "")
      const receiverName = normalizeCleanText(t.paymentData?.receiver?.name || "")
      const merchantName = normalizeCleanText(t.merchant?.name || "")
      const fullText = `${description} ${descriptionRaw} ${payerName} ${receiverName} ${merchantName}`

      // Checa se remetente corresponde ao paciente ou pagador secundário
      let isSenderMatch = false
      let senderReason = ""

      const matchedDoc = candidateDocs.find(
        (doc) => payerDoc && (payerDoc.includes(doc) || doc.includes(payerDoc))
      )

      if (matchedDoc) {
        isSenderMatch = true
        const isSecondary = secDocDigits && (payerDoc.includes(secDocDigits) || secDocDigits.includes(payerDoc))
        senderReason = isSecondary
          ? `Crédito de R$ ${targetAmount.toFixed(2)} conciliado por documento do pagador secundário (${payerDoc})`
          : `Crédito de R$ ${targetAmount.toFixed(2)} conciliado pelo documento (${payerDoc})`
      } else {
        const nameMatch = matchSenderPatientName(candidateNames, fullText)
        if (nameMatch.matched) {
          isSenderMatch = true
          senderReason = `Crédito de R$ ${targetAmount.toFixed(2)} conciliado: ${nameMatch.reason}`
        }
      }

      if (!isSenderMatch) {
        continue
      }

      // --- REGRA 2: ANTI-DUPLICAÇÃO (Idempotência Estrita) ---
      // Se a transação bancária já foi faturada para este médico, ela não pode ser reutilizada
      if (alreadyInvoicedTxIds.has(t.id)) {
        console.log(`[API check-payment] Transação ${t.id} já possui nota fiscal emitida. Ignorando para evitar duplicação.`)
        hasSkippedInvoiced = true
        continue
      }

      // --- REGRA 1: COMPLIANCE FISCAL E TEMPORAL (SEMPRE ATIVA) ---
      // NUNCA emitir notas de pagamentos anteriores ao cadastro do paciente / médico
      const txDate = new Date(t.date)
      if (minAllowedDate) {
        if (typeof t.date === "string" && t.date.length === 10) {
          const minDateStr = minAllowedDate.toISOString().slice(0, 10)
          if (t.date < minDateStr) {
            console.log(`[API check-payment] Transação ${t.id} (${t.date}) é de data anterior ao cadastro (${minDateStr}). Ignorando para não faturar pagamentos prévios.`)
            hasSkippedPriorToPatient = true
            continue
          }
        } else {
          // Timestamp completo: tolerância máxima de 60 segundos
          if (txDate.getTime() < minAllowedDate.getTime() - 60000) {
            console.log(`[API check-payment] Transação ${t.id} (${txDate.toISOString()}) é anterior ao cadastro (${minAllowedDate.toISOString()}). Ignorando para não faturar pagamentos prévios.`)
            hasSkippedPriorToPatient = true
            continue
          }
        }
      }

      matchFound = t
      matchReason = senderReason
      break
    }

    if (matchFound) {
      console.log(`[API check-payment] SUCESSO! Nova transação encontrada: ${matchFound.id} - ${matchReason}`)
      return NextResponse.json({
        pago: true,
        conciliado: true,
        motivo: matchReason,
        transacao: {
          id: matchFound.id,
          descricao: matchFound.description || "Transferência PIX Recebida",
          valor: Math.abs(Number(matchFound.amount)),
          data: matchFound.date,
          dataHora: matchFound.createdAt || matchFound.date || new Date().toISOString(),
          tipo: matchFound.type,
          pagador: matchFound.paymentData?.payer?.name || matchFound.description || "Remetente Identificado",
        },
      })
    }

    if (hasSkippedInvoiced) {
      console.log(`[API check-payment] Pagamento anterior já faturado. Aguardando nova transferência bancária deste paciente.`)
      return NextResponse.json({
        pago: false,
        conciliado: false,
        jaFaturado: true,
        mensagem: "O último pagamento identificado deste paciente já possui nota fiscal emitida no sistema. Aguardando a identificação de uma nova transferência bancária.",
        transacoesAnalisadas: transactions.length,
      })
    }

    if (hasSkippedPriorToPatient) {
      console.log(`[API check-payment] Pagamentos encontrados são anteriores ao cadastro do paciente.`)
      return NextResponse.json({
        pago: false,
        conciliado: false,
        mensagem: "Os pagamentos encontrados no extrato são anteriores à data de cadastro do paciente no sistema. Emissão retroativa bloqueada por compliance fiscal.",
        transacoesAnalisadas: transactions.length,
      })
    }

    console.log(`[API check-payment] Nenhuma transação bateu entre as ${transactions.length} analisadas.`)

    return NextResponse.json({
      pago: false,
      conciliado: false,
      mensagem: `Aguardando entrada de PIX de R$ ${targetAmount.toFixed(2)} conciliado com o paciente.`,
      transacoesAnalisadas: transactions.length,
    })
  } catch (err: unknown) {
    console.error("[API Check Payment] Erro:", err)
    return NextResponse.json(
      {
        pago: false,
        error: err instanceof Error ? err.message : "Erro ao checar transações bancárias.",
      },
      { status: 500 }
    )
  }
}
