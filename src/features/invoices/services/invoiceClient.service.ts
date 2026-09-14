import { supabase } from "@/lib/supabase/client"
import type { CheckPaymentResult, EmitirNotaResult, TomadorData } from "../types"

/**
 * Consulta o backend para verificar se caiu um crédito recente de R$ 0,01
 * na conta bancária selecionada através da API da Pluggy.
 */
export async function checkPaymentReceived(
  accountId: string,
  amount: number = 0.01,
  pacienteNome?: string,
  pacienteDocumento?: string,
  medicoId?: string,
  pacienteId?: string,
  minDate?: string
): Promise<CheckPaymentResult> {
  try {
    const { data: sessionData } = await supabase.auth.getSession()
    const token = sessionData?.session?.access_token

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }
    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }

    const response = await fetch("/api/pluggy/check-payment", {
      method: "POST",
      headers,
      body: JSON.stringify({ accountId, amount, pacienteNome, pacienteDocumento, medicoId, pacienteId, minDate }),
    })

    const data = await response.json().catch(() => null)

    if (!response.ok) {
      return {
        pago: false,
        error: data?.error || `Erro ao consultar pagamentos (${response.status}).`,
      }
    }

    return {
      pago: Boolean(data?.pago),
      conciliado: Boolean(data?.conciliado),
      transacao: data?.transacao,
      motivo: data?.motivo,
      mensagem: data?.mensagem,
      jaFaturado: data?.jaFaturado,
      error: data?.error,
    }
  } catch (err) {
    return {
      pago: false,
      error: err instanceof Error ? err.message : "Erro de conexão ao checar pagamento.",
    }
  }
}

/**
 * Dispara a emissão da primeira NFS-e Nacional no ambiente de homologação
 * da Focus NFe utilizando os dados fiscais homologados do médico e o tomador informado.
 */
export async function emitirPrimeiraNota(params: {
  medicoId: string
  tomador: TomadorData
  valor?: number
  transacaoId?: string
  dataPagamento?: string
}): Promise<EmitirNotaResult> {
  try {
    const { data: sessionData } = await supabase.auth.getSession()
    const token = sessionData?.session?.access_token

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }
    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }

    const response = await fetch("/api/focus/emitir-primeira-nota", {
      method: "POST",
      headers,
      body: JSON.stringify(params),
    })

    const data = await response.json().catch(() => null)

    if (!response.ok || !data?.success) {
      return {
        success: false,
        error: data?.error || `Falha na emissão da nota (${response.status}).`,
      }
    }

    return {
      success: true,
      referencia: data.referencia,
      status: data.status,
      numeroNfse: data.numeroNfse,
      codigoVerificacao: data.codigoVerificacao,
      caminhoDanfe: data.caminhoDanfe,
      caminhoXml: data.caminhoXml,
      mensagem: data.mensagem,
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erro de conexão ao emitir nota fiscal.",
    }
  }
}
