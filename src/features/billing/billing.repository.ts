import { supabase } from "@/lib/supabase/client"
import type { SubscriptionInfo } from "./types"

/**
 * Consulta a assinatura ativa do médico logado.
 * Se não houver registro na tabela `assinaturas`, retorna status "sem_assinatura".
 */
export async function getDoctorSubscription(medicoId?: string): Promise<SubscriptionInfo> {
  if (!medicoId) {
    return {
      id: "",
      medicoId: "",
      planoNome: "Nenhum",
      status: "sem_assinatura",
    }
  }

  try {
    const { data, error } = await supabase
      .from("assinaturas")
      .select(`
        id,
        medico_id,
        status,
        data_inicio,
        dia_vencimento,
        planos (
          nome,
          preco_mensal
        )
      `)
      .eq("medico_id", medicoId)
      .maybeSingle()

    if (error || !data) {
      return {
        id: "",
        medicoId,
        planoNome: "Nenhum",
        status: "sem_assinatura",
      }
    }

    const plano = Array.isArray(data.planos) ? data.planos[0] : data.planos

    return {
      id: data.id,
      medicoId: data.medico_id,
      planoNome: plano?.nome || "Plano Médico",
      status: data.status as SubscriptionInfo["status"],
      dataInicio: data.data_inicio,
      diaVencimento: data.dia_vencimento,
    }
  } catch (err) {
    console.error("Erro ao carregar assinatura:", err)
    return {
      id: "",
      medicoId,
      planoNome: "Nenhum",
      status: "sem_assinatura",
    }
  }
}

/**
 * Salva ou atualiza a assinatura do médico (simulação ou confirmação de contratação).
 */
export async function activateDoctorSubscription(
  medicoId: string,
  planoId: string,
  formaPagamento: "pix" | "cartao"
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from("assinaturas").upsert(
      {
        medico_id: medicoId,
        plano_id: planoId,
        status: "ativa",
        data_inicio: new Date().toISOString().split("T")[0],
        dia_vencimento: 5,
      },
      { onConflict: "medico_id" }
    )

    if (error) throw error

    // Atualiza status do médico para ativo
    await supabase
      .from("medicos")
      .update({ status: "ativo" })
      .eq("id", medicoId)

    // Configura ambiente para producao no client
    if (typeof window !== "undefined") {
      localStorage.setItem("notomed_env", "producao")
      window.dispatchEvent(new Event("notomed_env_change"))
    }

    return { success: true }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Falha ao ativar assinatura"
    return { success: false, error: message }
  }
}
