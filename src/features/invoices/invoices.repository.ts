import { supabase } from "@/lib/supabase/client"
import type { EmitirNotaResult } from "./types"

/**
 * Busca a última nota fiscal emitida para o médico (ex: nota de teste do onboarding)
 */
export async function getLatestDoctorInvoice(medicoId: string): Promise<EmitirNotaResult | null> {
  try {
    const { data, error } = await supabase
      .from("notas_fiscais")
      .select("*")
      .eq("medico_id", medicoId)
      .order("criado_em", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error || !data) {
      return null
    }

    return {
      success: true,
      status: "autorizado",
      numeroNfse: data.numero_nota,
      codigoVerificacao: data.codigo_verificacao || undefined,
      caminhoXml: data.xml_url || undefined,
      caminhoDanfe: data.pdf_url || undefined,
      dataPagamento: data.criado_em || undefined,
      mensagem: "Nota fiscal localizada no sistema.",
    }
  } catch (err) {
    console.error("[invoices.repository] Erro ao buscar última nota:", err)
    return null
  }
}
