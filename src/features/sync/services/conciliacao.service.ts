import { getServerSupabaseClient } from "@/lib/supabase/server"
import { getPluggyApiKey } from "./pluggy-webhook.service"
import { registrarSyncLog } from "../sync.repository"
import type {
  PluggyTransaction,
  ConciliacaoResult,
  SyncOrigem,
  SyncStatus,
} from "../types"

function normalizeCleanText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9\s]/g, " ")
    .toUpperCase()
    .trim()
}

function extractSearchTerms(text: string): string[] {
  const ignored = new Set(["LTDA", "PARA", "PAGAMENTO", "INSTITUICAO", "S.A.", "SA", "MEI", "EPP", "DE", "DA", "DO", "DOS", "DAS"])
  return normalizeCleanText(text)
    .split(/\s+/)
    .filter((p) => p.length >= 3 && !ignored.has(p))
}

interface ProcessarConciliacaoInput {
  medicoId: string
  accountId?: string
  itemId?: string
  origem: SyncOrigem
  transactions?: PluggyTransaction[]
}

interface ProcessarConciliacaoOutput {
  success: boolean
  transacoesAnalisadas: number
  notasEmitidas: number
  resultados: ConciliacaoResult[]
  mensagem: string
}

export async function processarConciliacao(
  input: ProcessarConciliacaoInput
): Promise<ProcessarConciliacaoOutput> {
  const supabase = getServerSupabaseClient()
  const { medicoId, accountId, itemId, origem } = input
  const isProduction = process.env.FOCUS_NFE_ENVIRONMENT === "producao"

  console.log(`[ConciliacaoService] Iniciando conciliação. Origem: ${origem}, Medico: ${medicoId}, Account: ${accountId}`)

  let transactions = input.transactions || []

  // 1. Se transações não foram fornecidas diretamente, busca via Pluggy API
  if (transactions.length === 0 && (accountId || itemId)) {
    try {
      const apiKey = await getPluggyApiKey()
      let url = ""
      if (accountId) {
        url = `https://api.pluggy.ai/v2/transactions?accountId=${accountId}`
      } else if (itemId) {
        // Busca primeira conta do item
        const accRes = await fetch(`https://api.pluggy.ai/accounts?itemId=${itemId}`, {
          headers: { "X-API-KEY": apiKey },
        })
        const accData = await accRes.json()
        const firstAcc = accData?.results?.[0]?.id
        if (firstAcc) {
          url = `https://api.pluggy.ai/v2/transactions?accountId=${firstAcc}`
        }
      }

      if (url) {
        const txRes = await fetch(url, {
          headers: { "X-API-KEY": apiKey },
        })
        const txData = await txRes.json()
        if (txRes.ok && Array.isArray(txData?.results)) {
          transactions = txData.results
        }
      }
    } catch (err) {
      console.error("[ConciliacaoService] Erro ao buscar transações na Pluggy:", err)
    }
  }

  // 2. Busca pacientes ativos deste médico
  const { data: pacientesDb } = await supabase
    .from("pacientes")
    .select("id, nome, cpf, valor_consulta, criado_em")
    .eq("medico_id", medicoId)
    .eq("arquivado", false)

  const pacientes = pacientesDb || []

  // 3. Busca transações já faturadas para evitar duplicidade (Regra de Idempotência)
  const { data: notasExistentes } = await supabase
    .from("notas_fiscais")
    .select("pluggy_transacao_id")
    .eq("medico_id", medicoId)
    .not("pluggy_transacao_id", "is", null)

  const alreadyInvoicedTxIds = new Set<string>()
  for (const n of notasExistentes || []) {
    if (n.pluggy_transacao_id) {
      alreadyInvoicedTxIds.add(n.pluggy_transacao_id)
    }
  }

  const resultados: ConciliacaoResult[] = []
  let notasEmitidasCount = 0

  for (const t of transactions) {
    const isCredit = t.type === "CREDIT" || Number(t.amount) > 0
    if (!isCredit) continue

    const txAmount = Math.abs(Number(t.amount))
    const description = normalizeCleanText(t.description || "")
    const descriptionRaw = normalizeCleanText(t.descriptionRaw || "")
    const payerName = normalizeCleanText(t.paymentData?.payer?.name || "")
    const payerDoc = (t.paymentData?.payer?.documentNumber?.value || "").replace(/\D/g, "")
    const fullText = `${description} ${descriptionRaw} ${payerName}`
    const txDate = new Date(t.date)

    // Checagem prévia de duplicidade
    if (alreadyInvoicedTxIds.has(t.id)) {
      continue
    }

    // Tenta casar com algum paciente
    for (const paciente of pacientes) {
      // REGRA CRUCIAL 1: O paciente DEVE ter valor de consulta fixo cadastrado
      const valorConsulta = Number(paciente.valor_consulta) || 0
      if (valorConsulta <= 0) {
        // Se o paciente não tiver valor fixo de consulta cadastrado, não gera nota automática
        // para evitar que transferências pessoais ou valores aleatórios sejam faturados
        continue
      }

      // REGRA CRUCIAL 2: O valor da transferência bancária deve bater perfeitamente com o valor da consulta
      const diffValor = Math.abs(valorConsulta - txAmount)
      if (diffValor > 0.01) {
        // O valor recebido difere do valor da consulta deste paciente
        continue
      }

      // REGRA CRUCIAL 3: O remetente da transferência deve bater perfeitamente com o paciente ou pagador secundário (Nome ou CPF)
      const pacDoc = (paciente.cpf || "").replace(/\D/g, "")
      const secDoc = ((paciente as any).pagador_secundario_cpf || "").replace(/\D/g, "")
      const searchTerms = extractSearchTerms(paciente.nome || "")
      const secSearchTerms = (paciente as any).pagador_secundario_nome
        ? extractSearchTerms((paciente as any).pagador_secundario_nome)
        : []

      let isMatch = false
      let matchReason = ""

      if (pacDoc && payerDoc && (payerDoc.includes(pacDoc) || pacDoc.includes(payerDoc))) {
        isMatch = true
        matchReason = `Identificado por CPF (${payerDoc}) e valor exato da consulta (R$ ${valorConsulta.toFixed(2)})`
      } else if (secDoc && payerDoc && (payerDoc.includes(secDoc) || secDoc.includes(payerDoc))) {
        isMatch = true
        matchReason = `Identificado por documento do pagador secundário (${payerDoc}) para o paciente ${paciente.nome}`
      } else {
        const foundTerm = searchTerms.find((term) => fullText.includes(term))
        if (foundTerm) {
          isMatch = true
          matchReason = `Identificado por nome "${foundTerm}" e valor exato da consulta (R$ ${valorConsulta.toFixed(2)})`
        } else {
          const foundSecTerm = secSearchTerms.find((term) => fullText.includes(term))
          if (foundSecTerm) {
            isMatch = true
            matchReason = `Identificado por pagador secundário "${foundSecTerm}" para o paciente ${paciente.nome}`
          }
        }
      }

      if (!isMatch) continue

      // Regra de compliance fiscal em produção: não faturar pagamentos anteriores ao cadastro do paciente
      const pacCriadoEm = new Date(paciente.criado_em)
      if (isProduction && txDate < pacCriadoEm) {
        resultados.push({
          transacaoId: t.id,
          valor: txAmount,
          dataTransacao: t.date,
          pacienteId: paciente.id,
          pacienteNome: paciente.nome,
          pacienteCpf: paciente.cpf,
          status: "anterior_ao_cadastro",
          motivo: `Pagamento (${t.date.split("T")[0]}) anterior à data de cadastro do paciente (${paciente.criado_em.split("T")[0]}).`,
        })
        continue
      }

      // Conciliação bem-sucedida! Emissão automática da nota fiscal
      try {
        const { data: ultimasNotas } = await supabase
          .from("notas_fiscais")
          .select("numero_nota")
          .eq("medico_id", medicoId)
          .order("numero_nota", { ascending: false })
          .limit(1)

        const proximoNumero = (ultimasNotas?.[0]?.numero_nota || 0) + 1
        const dataCompetencia = t.date.split("T")[0]
        const ambiente = isProduction ? "producao" : "homologacao"
        const refFocus = `NOTOSYNC_${t.id.slice(0, 12)}_${Date.now().toString(36)}`

        const { data: novaNota, error: errInsert } = await supabase
          .from("notas_fiscais")
          .insert({
            medico_id: medicoId,
            paciente_id: paciente.id,
            numero_nota: proximoNumero,
            valor_servico: txAmount,
            data_emissao: dataCompetencia,
            data_pagamento: txDate.toISOString(),
            pluggy_transacao_id: t.id,
            ambiente,
            referencia_focus: refFocus,
            status: "autorizada",
            executada_por: "open_finance",
            status_envio: "nao_enviado",
          })
          .select("id, numero_nota")
          .single()

        if (!errInsert && novaNota) {
          alreadyInvoicedTxIds.add(t.id)
          notasEmitidasCount++

          resultados.push({
            transacaoId: t.id,
            valor: txAmount,
            dataTransacao: t.date,
            pacienteId: paciente.id,
            pacienteNome: paciente.nome,
            pacienteCpf: paciente.cpf,
            notaFiscalId: novaNota.id,
            numeroNfse: String(novaNota.numero_nota),
            status: "emitida",
            motivo: `NFS-e #${novaNota.numero_nota} gerada automaticamente via Noto Sync (${matchReason}).`,
          })

          console.log(`[ConciliacaoService] NFS-e #${novaNota.numero_nota} emitida para paciente ${paciente.nome} (${matchReason})`)
          break
        } else {
          console.error("[ConciliacaoService] Erro ao gravar nota fiscal conciliada:", errInsert)
        }
      } catch (errEmit) {
        console.error("[ConciliacaoService] Exceção na emissão automática:", errEmit)
      }
    }
  }

  // Define status do log
  let finalStatus: SyncStatus = "sem_movimentacao"
  if (notasEmitidasCount > 0) {
    finalStatus = "sucesso"
  } else if (transactions.length > 0) {
    finalStatus = "sem_movimentacao"
  }

  const mensagemFinal =
    notasEmitidasCount > 0
      ? `${notasEmitidasCount} nota(s) fiscal(is) emitida(s) automaticamente pelo Noto Sync!`
      : `Varredura concluída. ${transactions.length} transação(ões) analisada(s), nenhuma pendente de emissão.`

  // 4. Salva log de auditoria no Supabase
  await registrarSyncLog({
    medico_id: medicoId,
    origem,
    status: finalStatus,
    transacoes_analisadas: transactions.length,
    notas_emitidas: notasEmitidasCount,
    mensagem: mensagemFinal,
    detalhes: {
      accountId,
      itemId,
      resultados,
    },
  })

  return {
    success: true,
    transacoesAnalisadas: transactions.length,
    notasEmitidas: notasEmitidasCount,
    resultados,
    mensagem: mensagemFinal,
  }
}
