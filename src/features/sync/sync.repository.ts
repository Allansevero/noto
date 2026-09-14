import { supabase } from "@/lib/supabase/client"
import { getCurrentDoctor } from "@/features/auth/auth.repository"
import type { NotoSyncLog, CriarSyncLogInput, SyncStats } from "./types"

/**
 * Lista os registros de auditoria do Noto Sync para o médico autenticado.
 */
export async function listSyncLogs(medicoId?: string, limit: number = 20): Promise<NotoSyncLog[]> {
  try {
    let targetMedicoId = medicoId
    if (!targetMedicoId) {
      const doc = await getCurrentDoctor()
      targetMedicoId = doc?.id
    }

    if (!targetMedicoId) return []

    const { data, error } = await supabase
      .from("noto_sync_logs")
      .select("*")
      .eq("medico_id", targetMedicoId)
      .order("criado_em", { ascending: false })
      .limit(limit)

    if (error) {
      console.warn("[sync.repository] Erro ao listar logs:", error.message)
      return []
    }

    return (data || []) as NotoSyncLog[]
  } catch (err) {
    console.error("[sync.repository] Exceção ao listar logs:", err)
    return []
  }
}

/**
 * Registra um evento de execução de conciliação / webhook na tabela noto_sync_logs.
 */
export async function registrarSyncLog(input: CriarSyncLogInput): Promise<{ success: boolean; log?: NotoSyncLog; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("noto_sync_logs")
      .insert({
        medico_id: input.medico_id,
        origem: input.origem,
        status: input.status,
        transacoes_analisadas: input.transacoes_analisadas,
        notas_emitidas: input.notas_emitidas,
        mensagem: input.mensagem || null,
        detalhes: input.detalhes || {},
      })
      .select()
      .single()

    if (error) {
      console.error("[sync.repository] Erro ao registrar log:", error.message)
      return { success: false, error: error.message }
    }

    return { success: true, log: data as NotoSyncLog }
  } catch (err) {
    console.error("[sync.repository] Exceção ao registrar log:", err)
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erro ao gravar log.",
    }
  }
}

/**
 * Obtém estatísticas consolidadas do Robô Noto Sync para exibição no Dashboard.
 */
export async function getSyncStats(medicoId?: string): Promise<SyncStats> {
  const fallbackStats: SyncStats = {
    totalNotasAutomaticas: 0,
    volumeFaturadoAutomatico: 0,
    contasMonitoradas: 0,
    ultimaSincronizacao: null,
    statusRobo: "inativo",
    webhookAtivo: true,
  }

  try {
    let targetMedicoId = medicoId
    if (!targetMedicoId) {
      const doc = await getCurrentDoctor()
      targetMedicoId = doc?.id
    }

    if (!targetMedicoId) return fallbackStats

    // 1. Contas bancárias ativas conectadas
    const { data: contas } = await supabase
      .from("medico_contas_bancarias")
      .select("id, ativa_para_recebimento")
      .eq("medico_id", targetMedicoId)
      .eq("ativa_para_recebimento", true)

    const contasMonitoradas = contas?.length || 0

    // 2. Notas fiscais geradas automaticamente via Noto Sync (executada_por = 'open_finance')
    const { data: notas } = await supabase
      .from("notas_fiscais")
      .select("id, valor_servico, status, executada_por, pluggy_transacao_id")
      .eq("medico_id", targetMedicoId)
      .or("executada_por.eq.open_finance,pluggy_transacao_id.not.is.null")
      .neq("status", "cancelada")

    const totalNotasAutomaticas = notas?.length || 0
    const volumeFaturadoAutomatico = (notas || []).reduce(
      (acc, curr) => acc + (Number(curr.valor_servico) || 0),
      0
    )

    // 3. Último log de sincronização registrado
    const { data: ultimosLogs } = await supabase
      .from("noto_sync_logs")
      .select("criado_em")
      .eq("medico_id", targetMedicoId)
      .order("criado_em", { ascending: false })
      .limit(1)

    const ultimaSincronizacao = ultimosLogs?.[0]?.criado_em || null

    return {
      totalNotasAutomaticas,
      volumeFaturadoAutomatico,
      contasMonitoradas,
      ultimaSincronizacao,
      statusRobo: contasMonitoradas > 0 ? "ativo" : "atencao",
      webhookAtivo: true,
    }
  } catch (err) {
    console.error("[sync.repository] Exceção ao obter stats:", err)
    return fallbackStats
  }
}
