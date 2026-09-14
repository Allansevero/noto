import { supabase, isSupabaseConfigured } from "@/lib/supabase/client"
import type { NotaFiscal } from "../types"
import type { DoctorProfile } from "@/features/auth/types"
import { generateNotaFiscalPdfBlob } from "./danfse-pdf.service"

const BUCKET_NAME = "notas_fiscais"

/**
 * Realiza o upload do PDF da NFS-e para o Supabase Storage
 * e atualiza o campo pdf_url na tabela notas_fiscais.
 */
export async function uploadNotaFiscalPdfToStorage(
  nota: NotaFiscal,
  doctor?: DoctorProfile | null
): Promise<{ success: boolean; pdfUrl?: string; error?: string }> {
  if (!isSupabaseConfigured) {
    return { success: false, error: "Supabase não configurado." }
  }

  try {
    const medicoId = nota.medico_id || doctor?.id || "geral"
    const filePath = `${medicoId}/${nota.id}.pdf`

    // Gera o Blob do PDF
    const pdfBlob = generateNotaFiscalPdfBlob(nota, doctor)

    // Upload para o bucket notas_fiscais com cacheControl e overwrite permitido
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, pdfBlob, {
        contentType: "application/pdf",
        upsert: true,
      })

    if (uploadError) {
      console.warn("[PdfStorageService] Erro no upload para o Supabase Storage:", uploadError)
      return { success: false, error: uploadError.message }
    }

    // Obtém a URL pública do PDF gravado no Storage
    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath)

    const pdfUrl = publicUrlData?.publicUrl

    if (pdfUrl) {
      // Atualiza a coluna pdf_url na tabela notas_fiscais
      await supabase
        .from("notas_fiscais")
        .update({ pdf_url: pdfUrl })
        .eq("id", nota.id)

      return { success: true, pdfUrl }
    }

    return { success: false, error: "Não foi possível gerar a URL pública do PDF." }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido ao salvar PDF no Storage."
    console.error("[PdfStorageService] Falha:", err)
    return { success: false, error: message }
  }
}
