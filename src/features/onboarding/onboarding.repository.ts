import { supabase, isSupabaseConfigured } from "@/lib/supabase/client"
import type { ExtractedFiscalData, SaveFiscalResult } from "./types"

/**
 * Salva os dados fiscais extraídos do XML da NFS-e no Supabase vinculando ao médico ativo.
 */
export async function saveDoctorFiscalData(
  medicoId: string,
  fiscalData: ExtractedFiscalData
): Promise<SaveFiscalResult> {
  if (!isSupabaseConfigured) {
    return { success: false, error: "Supabase não configurado no arquivo .env." }
  }

  if (!medicoId) {
    return { success: false, error: "ID do médico ausente para vinculação." }
  }

  try {
    // 1. Atualiza o CNPJ na tabela medicos se presente
    if (fiscalData.cnpj) {
      await supabase
        .from("medicos")
        .update({
          cnpj: fiscalData.cnpj,
          atualizado_em: new Date().toISOString(),
        })
        .eq("id", medicoId)
    }

    // 2. Prepara o payload para medico_dados_fiscais
    const payload = {
      medico_id: medicoId,
      razao_social: fiscalData.razao_social || null,
      logradouro: fiscalData.logradouro || null,
      numero: fiscalData.numero || null,
      complemento: fiscalData.complemento || null,
      bairro: fiscalData.bairro || null,
      codigo_municipio_ibge: fiscalData.codigo_municipio_ibge || null,
      uf: fiscalData.uf ? fiscalData.uf.substring(0, 2) : null,
      cep: fiscalData.cep || null,
      telefone: fiscalData.telefone || null,
      email: fiscalData.email || null,
      opcao_simples_nacional: fiscalData.opcao_simples_nacional || null,
      regime_especial_tributacao: fiscalData.regime_especial_tributacao || null,
      codigo_municipio_emissao: fiscalData.codigo_municipio_emissao || null,
      codigo_tributacao_nacional: fiscalData.codigo_tributacao_nacional || null,
      codigo_nbs: fiscalData.codigo_nbs || null,
      tributacao_issqn: fiscalData.tributacao_issqn || null,
      tipo_retencao_issqn: fiscalData.tipo_retencao_issqn || null,
      aliquota_iss_referencia: fiscalData.aliquota_iss_referencia ?? null,
      pct_trib_federal_referencia: fiscalData.pct_trib_federal_referencia ?? null,
      ultima_nota_numero: fiscalData.ultima_nota_numero ?? null,
      ultimo_xml_processado_em: fiscalData.ultimo_xml_processado_em || new Date().toISOString(),
      atualizado_em: new Date().toISOString(),
    }

    const { error: upsertError } = await supabase
      .from("medico_dados_fiscais")
      .upsert(payload, { onConflict: "medico_id" })

    if (upsertError) {
      console.warn("[onboarding.repository] Erro no Supabase:", upsertError.message)
      return { success: false, error: `Erro no Supabase: ${upsertError.message}` }
    }

    return { success: true }
  } catch (err: unknown) {
    console.warn("[onboarding.repository] Erro geral ao salvar:", err)
    return {
      success: false,
      error: err instanceof Error ? err.message : "Falha ao gravar dados fiscais no Supabase.",
    }
  }
}

/**
 * Consulta os dados fiscais já cadastrados para o médico no Supabase.
 */
export async function getDoctorFiscalData(
  medicoId: string
): Promise<ExtractedFiscalData | null> {
  if (!isSupabaseConfigured || !medicoId) return null

  try {
    const [fiscalRes, medicoRes] = await Promise.all([
      supabase
        .from("medico_dados_fiscais")
        .select("*")
        .eq("medico_id", medicoId)
        .maybeSingle(),
      supabase
        .from("medicos")
        .select("cnpj")
        .eq("id", medicoId)
        .maybeSingle(),
    ])

    const data = fiscalRes.data
    if (!data) return null

    const resolvedCnpj = medicoRes.data?.cnpj || (data as unknown as { cnpj?: string }).cnpj || undefined

    return {
      cnpj: resolvedCnpj,
      razao_social: data.razao_social,
      logradouro: data.logradouro,
      numero: data.numero,
      complemento: data.complemento,
      bairro: data.bairro,
      codigo_municipio_ibge: data.codigo_municipio_ibge,
      uf: data.uf,
      cep: data.cep,
      telefone: data.telefone,
      email: data.email,
      opcao_simples_nacional: data.opcao_simples_nacional,
      regime_especial_tributacao: data.regime_especial_tributacao,
      codigo_municipio_emissao: data.codigo_municipio_emissao,
      codigo_tributacao_nacional: data.codigo_tributacao_nacional,
      codigo_nbs: data.codigo_nbs,
      tributacao_issqn: data.tributacao_issqn,
      tipo_retencao_issqn: data.tipo_retencao_issqn,
      aliquota_iss_referencia: data.aliquota_iss_referencia ? Number(data.aliquota_iss_referencia) : undefined,
      pct_trib_federal_referencia: data.pct_trib_federal_referencia ? Number(data.pct_trib_federal_referencia) : undefined,
      ultima_nota_numero: data.ultima_nota_numero ? Number(data.ultima_nota_numero) : undefined,
      ultimo_xml_processado_em: data.ultimo_xml_processado_em,
      focus_empresa_id: data.focus_empresa_id || null,
      focus_empresa_status: data.focus_empresa_status || null,
      certificado_validado_em: data.certificado_validado_em || null,
    }
  } catch {
    return null
  }
}

const ONBOARDING_STEP_KEY_PREFIX = "notomed_onboarding_step_"

/**
 * Salva o checkpoint da etapa em que o usuário está no onboarding.
 * Persiste imediatamente em localStorage e opcionalmente em noto_sync_logs no Supabase para cross-device.
 */
export async function saveOnboardingStep(
  medicoId: string,
  step: number
): Promise<void> {
  if (!medicoId || step < 1 || step > 4) return

  // 1. Persistência local imediata
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(`${ONBOARDING_STEP_KEY_PREFIX}${medicoId}`, String(step))
    }
  } catch (e) {
    console.warn("[onboarding.repository] Erro ao salvar step no localStorage:", e)
  }

  // 2. Persistência no Supabase via noto_sync_logs para sincronização cross-device
  if (isSupabaseConfigured) {
    try {
      await supabase.from("noto_sync_logs").insert({
        medico_id: medicoId,
        origem: "onboarding_step",
        status: `step_${step}`,
        mensagem: `Checkpoint do onboarding salvo na etapa ${step}`,
        detalhes: { step, saved_at: new Date().toISOString() },
      })
    } catch {
      // Falha silenciosa para não travar a experiência do usuário
    }
  }
}

/**
 * Recupera o último checkpoint salvo da etapa do onboarding.
 */
export async function getSavedOnboardingStep(
  medicoId: string
): Promise<number | null> {
  if (!medicoId) return null

  // 1. Tenta recuperar do localStorage (mais rápido)
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const localVal = window.localStorage.getItem(`${ONBOARDING_STEP_KEY_PREFIX}${medicoId}`)
      if (localVal) {
        const parsed = parseInt(localVal, 10)
        if (parsed >= 1 && parsed <= 4) return parsed
      }
    }
  } catch {
    // Continua para o Supabase
  }

  // 2. Fallback para o Supabase (cross-device)
  if (isSupabaseConfigured) {
    try {
      const { data } = await supabase
        .from("noto_sync_logs")
        .select("status, detalhes, criado_em")
        .eq("medico_id", medicoId)
        .eq("origem", "onboarding_step")
        .order("criado_em", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (data?.detalhes && typeof data.detalhes === "object" && "step" in data.detalhes) {
        const step = Number((data.detalhes as { step?: number }).step)
        if (step >= 1 && step <= 4) return step
      }
      if (data?.status?.startsWith("step_")) {
        const step = parseInt(data.status.replace("step_", ""), 10)
        if (step >= 1 && step <= 4) return step
      }
    } catch {
      // Ignora erro
    }
  }

  return null
}
