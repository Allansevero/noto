import { supabase } from "@/lib/supabase/client"

export interface FocusRegisterResult {
  success: boolean
  empresaId?: string
  status?: string
  mensagem?: string
  error?: string
}

/**
 * Envia o certificado digital e a senha para o servidor Next.js (/api/focus/empresa),
 * que orquestra os dados fiscais salvos no Supabase com a API da Focus NFe de forma segura.
 */
export async function enviarCertificadoParaFocusNFe(params: {
  medicoId: string
  certificateFile: File
  password: string
}): Promise<FocusRegisterResult> {
  const { medicoId, certificateFile, password } = params

  try {
    const { data: sessionData } = await supabase.auth.getSession()
    const token = sessionData?.session?.access_token

    const formData = new FormData()
    formData.append("medicoId", medicoId)
    formData.append("certificateFile", certificateFile)
    formData.append("password", password)

    const headers: Record<string, string> = {}
    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }

    const response = await fetch("/api/focus/empresa", {
      method: "POST",
      headers,
      body: formData,
    })

    const data = await response.json().catch(() => null)

    if (!response.ok || !data?.success) {
      return {
        success: false,
        error: data?.error || `Falha na comunicação com o servidor (${response.status}).`,
      }
    }

    return {
      success: true,
      empresaId: data.empresaId,
      status: data.status,
      mensagem: data.mensagem,
    }
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erro de conexão ao enviar certificado.",
    }
  }
}
