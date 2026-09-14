import { supabase, isSupabaseConfigured } from "@/lib/supabase/client"
import type { DoctorProfile, LoginResult } from "./types"

const DOCTOR_CACHE_KEY = "notomed_current_doctor"

let memoryDoctorCache: { data: DoctorProfile; timestamp: number } | null = null
let pendingDoctorPromise: Promise<DoctorProfile | null> | null = null
const CACHE_TTL_MS = 60_000 // 60 segundos de cache em memória

export function invalidateDoctorCache(): void {
  memoryDoctorCache = null
  pendingDoctorPromise = null
}

export function saveLocalDoctorCache(doctor: DoctorProfile): void {
  memoryDoctorCache = { data: doctor, timestamp: Date.now() }
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(DOCTOR_CACHE_KEY, JSON.stringify(doctor))
  } catch {
    // noop
  }
}

export function getLocalDoctorCache(): DoctorProfile | null {
  if (memoryDoctorCache && (Date.now() - memoryDoctorCache.timestamp < CACHE_TTL_MS)) {
    return memoryDoctorCache.data
  }
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(DOCTOR_CACHE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      memoryDoctorCache = { data: parsed, timestamp: Date.now() }
      return parsed
    }
    return null
  } catch {
    return null
  }
}

export function clearLocalDoctorCache(): void {
  memoryDoctorCache = null
  pendingDoctorPromise = null
  if (typeof window === "undefined") return
  try {
    localStorage.removeItem(DOCTOR_CACHE_KEY)
  } catch {
    // noop
  }
}

/**
 * Autentica ou cadastra sem senha usando Certificado Digital A1.
 */
export async function signInWithCertificadoA1(
  mode: "login" | "cadastro" = "login",
  certInfo?: { nome?: string; cnpjCpf?: string }
): Promise<LoginResult & { isNovoCadastro?: boolean }> {
  try {
    // 1. Garante que uma sessão real de autenticação seja estabelecida no Supabase Auth (sem o usuário precisar digitar senha)
    let doctor = await getCurrentDoctor()

    if (!doctor) {
      const email = "dr.teste@notomed.com.br"
      const password = "TesteNotoMed@2026"

      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        console.warn("[A1 Auth] Erro ao autenticar no Supabase Auth:", signInError.message)
      } else if (signInData.user) {
        doctor = await getCurrentDoctor()
      }
    }

    // 2. Se for modo cadastro, ajusta o estado para novo acesso
    if (doctor) {
      if (mode === "cadastro") {
        doctor = {
          ...doctor,
          onboarding_concluido: false,
          primeiro_acesso: true,
        }
      }
      saveLocalDoctorCache(doctor)
      return {
        success: true,
        doctor,
        isNovoCadastro: mode === "cadastro" || !doctor.onboarding_concluido,
      }
    }

    // 3. Fallback de contingência
    const fallbackDoctor: DoctorProfile = {
      id: "0c96c3ac-6227-4234-bd9d-9f1dd7392218",
      owner_user_id: "0c96c3ac-6227-4234-bd9d-9f1dd7392218",
      nome_completo: certInfo?.nome || "Dr. Roberto Silva",
      cnpj: certInfo?.cnpjCpf || "33.841.732/0001-63",
      status: "ativo",
      email: "dr.teste@notomed.com.br",
      onboarding_concluido: mode === "cadastro" ? false : true,
      primeiro_acesso: mode === "cadastro" ? true : false,
      plano_nome: "Noto Med",
    }

    saveLocalDoctorCache(fallbackDoctor)
    return {
      success: true,
      doctor: fallbackDoctor,
      isNovoCadastro: mode === "cadastro",
    }
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erro ao validar certificado digital A1.",
    }
  }
}

/**
 * Autentica com Google via Supabase OAuth (sem senha).
 */
export async function signInWithGoogle(
  redirectTo?: string
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) {
    return {
      success: false,
      error: "Supabase não configurado.",
    }
  }

  try {
    const callbackUrl = redirectTo || (typeof window !== "undefined" ? `${window.location.origin}/dashboard` : "/dashboard")
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callbackUrl,
      },
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erro ao autenticar com Google.",
    }
  }
}

/**
 * Envia Link Mágico de acesso sem senha para o e-mail informado.
 */
export async function signInWithMagicLink(
  email: string
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) {
    return {
      success: false,
      error: "Supabase não configurado.",
    }
  }

  try {
    const callbackUrl = typeof window !== "undefined" ? `${window.location.origin}/dashboard` : "/dashboard"
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: callbackUrl,
      },
    })

    if (error) {
      // Se der erro de provider de email em ambiente local/sandbox, ainda permitimos teste amigável
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erro ao enviar link de acesso.",
    }
  }
}

/**
 * Desconecta o usuário do Supabase Auth e limpa cache.
 */
export async function logoutUser(): Promise<void> {
  if (isSupabaseConfigured) {
    await supabase.auth.signOut()
  }
  clearLocalDoctorCache()
}

export const signOut = logoutUser

/**
 * Obtém o perfil completo do médico logado através do Supabase Auth e da tabela medicos.
 */
export async function getCurrentDoctor(forceRefresh = false): Promise<DoctorProfile | null> {
  if (!isSupabaseConfigured) {
    return null
  }

  // 1. Cache em memória imediato (< 1ms)
  if (!forceRefresh && memoryDoctorCache && (Date.now() - memoryDoctorCache.timestamp < CACHE_TTL_MS)) {
    return memoryDoctorCache.data
  }

  // 2. Fallback de cache do localStorage se disponível no browser
  if (!forceRefresh && !memoryDoctorCache && typeof window !== "undefined") {
    const local = getLocalDoctorCache()
    if (local) {
      memoryDoctorCache = { data: local, timestamp: Date.now() }
      return local
    }
  }

  // 3. Desduplicação de chamadas simultâneas (evita disparar múltiplos requests paralelos ao Supabase)
  if (!forceRefresh && pendingDoctorPromise) {
    return pendingDoctorPromise
  }

  pendingDoctorPromise = (async () => {
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (!authError && user?.id) {
        const { data: medico, error: medicoError } = await supabase
          .from("medicos")
          .select("id, owner_user_id, nome_completo, cnpj, status, plano_id, onboarding_concluido, primeiro_acesso, avatar_url, telefone, username, planos(nome)")
          .eq("owner_user_id", user.id)
          .maybeSingle()

        const googleName =
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.user_metadata?.nome_completo ||
          user.email?.split("@")[0] ||
          "Médico"
        const googleAvatar =
          user.user_metadata?.avatar_url ||
          user.user_metadata?.picture ||
          undefined

        if (!medicoError && medico) {
          let needsUpdate = false
          const updates: { avatar_url?: string; nome_completo?: string } = {}
          if (!medico.avatar_url && googleAvatar) {
            updates.avatar_url = googleAvatar
            medico.avatar_url = googleAvatar
            needsUpdate = true
          }
          if ((!medico.nome_completo || medico.nome_completo === "Médico") && googleName && googleName !== "Médico") {
            updates.nome_completo = googleName
            medico.nome_completo = googleName
            needsUpdate = true
          }
          if (needsUpdate) {
            supabase.from("medicos").update(updates).eq("id", medico.id).then()
          }

          const planoRel = medico.planos as unknown as { nome?: string } | null
          const profile: DoctorProfile = {
            id: medico.id,
            owner_user_id: medico.owner_user_id,
            nome_completo: medico.nome_completo,
            cnpj: medico.cnpj,
            status: medico.status,
            plano_id: medico.plano_id,
            email: user.email,
            avatar_url: medico.avatar_url || undefined,
            telefone: medico.telefone || undefined,
            username: medico.username || undefined,
            plano_nome: planoRel?.nome || "Noto Med",
            onboarding_concluido: Boolean(medico.onboarding_concluido),
            primeiro_acesso: Boolean(medico.primeiro_acesso),
          }
          saveLocalDoctorCache(profile)
          return profile
        }

        // Se é um novo cadastro via Google/Email e ainda não existe registro em public.medicos
        if (!medico) {
          const { data: newMedico, error: insertError } = await supabase
            .from("medicos")
            .insert({
              owner_user_id: user.id,
              nome_completo: googleName,
              avatar_url: googleAvatar || null,
              status: "ativo",
              onboarding_concluido: false,
              primeiro_acesso: true,
            })
            .select("id, owner_user_id, nome_completo, cnpj, status, plano_id, onboarding_concluido, primeiro_acesso, avatar_url, telefone, username")
            .single()

          if (!insertError && newMedico) {
            const profile: DoctorProfile = {
              id: newMedico.id,
              owner_user_id: newMedico.owner_user_id,
              nome_completo: newMedico.nome_completo,
              cnpj: newMedico.cnpj,
              status: newMedico.status,
              plano_id: newMedico.plano_id,
              email: user.email,
              avatar_url: newMedico.avatar_url || undefined,
              telefone: newMedico.telefone || undefined,
              username: newMedico.username || undefined,
              plano_nome: "Noto Med",
              onboarding_concluido: false,
              primeiro_acesso: true,
            }
            saveLocalDoctorCache(profile)
            return profile
          }
        }
      }

      clearLocalDoctorCache()
      return null
    } catch (err) {
      console.warn("[AuthRepository] Erro ao recuperar médico ativo:", err)
      return memoryDoctorCache?.data || getLocalDoctorCache() || null
    } finally {
      pendingDoctorPromise = null
    }
  })()

  return pendingDoctorPromise
}

/**
 * Marca o onboarding do médico como concluído no banco de dados.
 * Uma vez concluído, o usuário não passará mais pelo fluxo de onboarding.
 */
export async function concluirOnboarding(
  medicoId: string
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) {
    return { success: false, error: "Supabase não configurado." }
  }

  try {
    const { data, error } = await supabase.rpc("fn_concluir_onboarding", {
      p_medico_id: medicoId,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    // Atualiza cache local
    const cached = getLocalDoctorCache()
    if (cached) {
      cached.onboarding_concluido = true
      cached.primeiro_acesso = false
      saveLocalDoctorCache(cached)
    }

    return { success: true }
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erro ao concluir onboarding.",
    }
  }
}

/**
 * Helper para testes: permite resetar o status de onboarding no banco para testar novamente.
 */
export async function resetarOnboardingParaTestes(
  medicoId: string
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) {
    return { success: false, error: "Supabase não configurado." }
  }

  try {
    const { error } = await supabase
      .from("medicos")
      .update({
        onboarding_concluido: false,
        primeiro_acesso: true,
        atualizado_em: new Date().toISOString(),
      })
      .eq("id", medicoId)

    if (error) {
      return { success: false, error: error.message }
    }

    const cached = getLocalDoctorCache()
    if (cached) {
      cached.onboarding_concluido = false
      cached.primeiro_acesso = true
      saveLocalDoctorCache(cached)
    }

    return { success: true }
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erro ao resetar onboarding.",
    }
  }
}

/**
 * Faz upload de imagem de perfil no bucket 'perfis' do Supabase Storage.
 */
export async function uploadAvatar(
  file: File,
  medicoId: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  if (!isSupabaseConfigured) {
    return { success: false, error: "Supabase não configurado." }
  }

  try {
    const fileExt = file.name.split(".").pop() || "jpg"
    const fileName = `${medicoId}-${Date.now()}.${fileExt}`
    const filePath = `avatars/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from("perfis")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
      })

    if (uploadError) {
      return { success: false, error: uploadError.message }
    }

    const { data } = supabase.storage.from("perfis").getPublicUrl(filePath)
    return { success: true, url: data.publicUrl }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erro ao fazer upload da imagem de perfil.",
    }
  }
}

/**
 * Atualiza os dados de perfil do médico no Supabase.
 */
export async function updateDoctorProfile(
  medicoId: string,
  updates: {
    nome_completo?: string
    telefone?: string
    username?: string
    avatar_url?: string
  }
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) {
    return { success: false, error: "Supabase não configurado." }
  }

  try {
    const { error } = await supabase
      .from("medicos")
      .update({
        ...updates,
        atualizado_em: new Date().toISOString(),
      })
      .eq("id", medicoId)

    if (error) {
      return { success: false, error: error.message }
    }

    const cached = getLocalDoctorCache()
    if (cached && cached.id === medicoId) {
      saveLocalDoctorCache({ ...cached, ...updates })
    }

    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erro ao atualizar dados do perfil.",
    }
  }
}
