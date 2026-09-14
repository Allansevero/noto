import { supabase } from "@/lib/supabase/client"
import type { ContaBancaria } from "./types"

/**
 * Busca todas as contas bancárias conectadas do médico no Supabase.
 */
export async function getDoctorBankAccounts(medicoId: string): Promise<ContaBancaria[]> {
  try {
    const { data, error } = await supabase
      .from("medico_contas_bancarias")
      .select("*")
      .eq("medico_id", medicoId)
      .order("criado_em", { ascending: false })

    if (error) {
      console.error("[banking.repository] Erro ao buscar contas:", error.message)
      return []
    }

    return (data || []) as ContaBancaria[]
  } catch (err) {
    console.error("[banking.repository] Exceção ao buscar contas:", err)
    return []
  }
}

/**
 * Atualiza o status de conta ativa para recebimento de pagamentos de pacientes.
 */
export async function setContaAtivaParaRecebimento(
  contaId: string,
  ativa: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from("medico_contas_bancarias")
      .update({
        ativa_para_recebimento: ativa,
        atualizado_em: new Date().toISOString(),
      })
      .eq("id", contaId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erro ao atualizar conta.",
    }
  }
}
