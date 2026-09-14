import { supabase, isSupabaseConfigured } from "@/lib/supabase/client"
import { getCurrentDoctor } from "@/features/auth/auth.repository"
import { PACIENTE_ONBOARDING_TESTE } from "@/config/constants"
import type { Paciente, CriarPacienteInput, AtualizarPacienteInput, PacienteNotaSummary } from "./types"

const PAGADORES_SECUNDARIOS_KEY = "notomed_pagadores_secundarios"

export function getStoredPagadoresSecundarios(): Record<string, { nome?: string; cpf?: string }> {
  if (typeof window === "undefined") return {}
  try {
    const raw = localStorage.getItem(PAGADORES_SECUNDARIOS_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function savePagadorSecundario(pacienteId: string, nome?: string | null, cpf?: string | null) {
  if (typeof window === "undefined" || !pacienteId) return
  try {
    const all = getStoredPagadoresSecundarios()
    if (!nome && !cpf) {
      delete all[pacienteId]
    } else {
      all[pacienteId] = { nome: nome || undefined, cpf: cpf || undefined }
    }
    localStorage.setItem(PAGADORES_SECUNDARIOS_KEY, JSON.stringify(all))
  } catch (err) {
    console.warn("Erro ao salvar pagador secundário:", err)
  }
}

/**
 * Lista todos os pacientes vinculados ao médico autenticado.
 */
export async function listPacientes(includeArchived = false): Promise<Paciente[]> {
  const doctor = await getCurrentDoctor()
  const medicoId = doctor?.id
  const storedSecPayers = getStoredPagadoresSecundarios()

  if (isSupabaseConfigured && medicoId) {
    try {
      let query = supabase
        .from("pacientes")
        .select("id, medico_id, clinica_id, nome, cpf, email, telefone, valor_consulta, arquivado, criado_em, notas_fiscais(count)")
        .eq("medico_id", medicoId)
        .order("nome", { ascending: true })

      if (!includeArchived) {
        query = query.eq("arquivado", false)
      }

      const { data, error } = await query

      if (!error && data) {
        return data.map((item) => {
          const countArr = item.notas_fiscais as unknown as { count?: number }[] | null
          const total_notas = countArr?.[0]?.count ?? 0
          const sec = storedSecPayers[item.id]
          return {
            ...item,
            pagador_secundario_nome: sec?.nome || null,
            pagador_secundario_cpf: sec?.cpf || null,
            total_notas,
          } as Paciente
        })
      }
    } catch (err) {
      console.warn("[PacientesRepository] Erro ao listar pacientes:", err)
    }
  }

  // Pacientes padrão / fallback
  return [
    {
      id: "pac-1",
      medico_id: medicoId || "dr-default",
      nome: "Beatriz Helena Santos",
      cpf: "82150391820",
      email: "beatriz.santos@email.com",
      telefone: "(11) 98765-4321",
      valor_consulta: 350,
      total_notas: 4,
      arquivado: false,
      criado_em: new Date().toISOString(),
    },
    {
      id: "pac-2",
      medico_id: medicoId || "dr-default",
      nome: "Carlos Eduardo Pereira",
      cpf: "39182047155",
      email: "carlos.pereira@email.com",
      telefone: "(11) 97654-3210",
      valor_consulta: 280,
      total_notas: 2,
      arquivado: false,
      criado_em: new Date().toISOString(),
    },
    {
      id: "pac-3",
      medico_id: medicoId || "dr-default",
      nome: "Fernanda Lima Albuquerque",
      cpf: "60428193077",
      email: "fernanda.lima@email.com",
      telefone: "(21) 99887-6655",
      valor_consulta: 500,
      total_notas: 6,
      arquivado: false,
      criado_em: new Date().toISOString(),
    },
    {
      id: "pac-4",
      medico_id: medicoId || "dr-default",
      nome: "Guilherme Augusto Souza",
      cpf: "91238471052",
      email: "guilherme.souza@email.com",
      telefone: "(31) 98877-1122",
      valor_consulta: 420,
      total_notas: 1,
      arquivado: false,
      criado_em: new Date().toISOString(),
    },
    {
      id: "pac-5",
      medico_id: medicoId || "dr-default",
      nome: "Lucas Gabriel Oliveira",
      cpf: "71940382914",
      email: "lucas.oliveira@email.com",
      telefone: "(41) 99123-4567",
      valor_consulta: 300,
      total_notas: 3,
      arquivado: false,
      criado_em: new Date().toISOString(),
    },
    {
      id: "pac-6",
      medico_id: medicoId || "dr-default",
      nome: "Mariana Costa Silva",
      cpf: "48291037281",
      email: "mariana.costa@email.com",
      telefone: "(11) 99234-5678",
      valor_consulta: 450,
      total_notas: 5,
      arquivado: false,
      criado_em: new Date().toISOString(),
    },
  ]
}

/**
 * Cria um novo paciente para o médico autenticado.
 */
export async function criarPaciente(
  input: CriarPacienteInput
): Promise<{ success: boolean; paciente?: Paciente; error?: string }> {
  const doctor = await getCurrentDoctor()
  const medicoId = doctor?.id

  if (!medicoId) {
    return { success: false, error: "Médico não autenticado." }
  }

  const cleanDoc = input.cpf ? input.cpf.replace(/\D/g, "") : null
  const cleanPhone = input.telefone ? input.telefone.replace(/\D/g, "") : null

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from("pacientes")
        .insert({
          medico_id: medicoId,
          nome: input.nome.trim(),
          cpf: cleanDoc,
          email: input.email?.trim() || null,
          telefone: cleanPhone || input.telefone || null,
          valor_consulta: input.valor_consulta !== undefined ? input.valor_consulta : null,
          arquivado: false,
        })
        .select()
        .single()

      if (error) {
        return { success: false, error: error.message }
      }

      savePagadorSecundario(
        data.id,
        input.pagador_secundario_nome,
        input.pagador_secundario_cpf
      )

      return {
        success: true,
        paciente: {
          ...data,
          pagador_secundario_nome: input.pagador_secundario_nome || null,
          pagador_secundario_cpf: input.pagador_secundario_cpf || null,
        } as Paciente,
      }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Erro ao cadastrar paciente.",
      }
    }
  }

  // Fallback local
  const novo: Paciente = {
    id: `pac-${Date.now()}`,
    medico_id: medicoId,
    nome: input.nome.trim(),
    cpf: cleanDoc,
    email: input.email?.trim() || null,
    telefone: input.telefone || null,
    valor_consulta: input.valor_consulta !== undefined ? input.valor_consulta : null,
    pagador_secundario_nome: input.pagador_secundario_nome || null,
    pagador_secundario_cpf: input.pagador_secundario_cpf || null,
    arquivado: false,
    criado_em: new Date().toISOString(),
  }
  savePagadorSecundario(
    novo.id,
    input.pagador_secundario_nome,
    input.pagador_secundario_cpf
  )
  return { success: true, paciente: novo }
}

/**
 * Atualiza os dados de um paciente existente.
 */
export async function atualizarPaciente(
  id: string,
  input: AtualizarPacienteInput
): Promise<{ success: boolean; paciente?: Paciente; error?: string }> {
  const doctor = await getCurrentDoctor()
  const medicoId = doctor?.id

  if (!medicoId) {
    return { success: false, error: "Médico não autenticado." }
  }

  const payload: Record<string, unknown> = {}
  if (input.nome !== undefined) payload.nome = input.nome.trim()
  if (input.cpf !== undefined) payload.cpf = input.cpf ? input.cpf.replace(/\D/g, "") : null
  if (input.email !== undefined) payload.email = input.email?.trim() || null
  if (input.telefone !== undefined) payload.telefone = input.telefone ? input.telefone.replace(/\D/g, "") : null
  if (input.valor_consulta !== undefined) payload.valor_consulta = input.valor_consulta
  if (input.arquivado !== undefined) payload.arquivado = input.arquivado

  if (input.pagador_secundario_nome !== undefined || input.pagador_secundario_cpf !== undefined) {
    savePagadorSecundario(
      id,
      input.pagador_secundario_nome,
      input.pagador_secundario_cpf
    )
  }

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from("pacientes")
        .update(payload)
        .eq("id", id)
        .eq("medico_id", medicoId)
        .select()
        .single()

      if (error) {
        return { success: false, error: error.message }
      }

      const secPayers = getStoredPagadoresSecundarios()
      const sec = secPayers[id]

      return {
        success: true,
        paciente: {
          ...data,
          pagador_secundario_nome: sec?.nome || null,
          pagador_secundario_cpf: sec?.cpf || null,
        } as Paciente,
      }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Erro ao atualizar paciente.",
      }
    }
  }

  return { success: true }
}

/**
 * Arquiva ou desarquiva um paciente.
 */
export async function arquivarPaciente(
  id: string,
  arquivar = true
): Promise<{ success: boolean; error?: string }> {
  return atualizarPaciente(id, { arquivado: arquivar })
}

/**
 * Busca o histórico de notas fiscais emitidas para o paciente.
 */
export async function getHistoricoNotas(
  pacienteId: string,
  cpf?: string | null
): Promise<PacienteNotaSummary[]> {
  if (!isSupabaseConfigured) return []

  try {
    let query = supabase
      .from("notas_fiscais")
      .select("id, numero_nota, valor_servico, data_emissao, status, pdf_url")
      .order("criado_em", { ascending: false })

    if (pacienteId && !pacienteId.startsWith("pac-")) {
      query = query.eq("paciente_id", pacienteId)
    } else if (cpf) {
      const cleanCpf = cpf.replace(/\D/g, "")
      query = query.eq("tomador_cpf", cleanCpf)
    } else {
      return []
    }

    const { data, error } = await query
    if (error || !data) return []

    return data.map((n) => ({
      id: n.id,
      numero_nfse: n.numero_nota ? String(n.numero_nota) : undefined,
      valor_servico: Number(n.valor_servico) || 0,
      data_emissao: n.data_emissao,
      status: n.status || "autorizada",
      pdf_url: n.pdf_url || undefined,
    }))
  } catch (err) {
    console.warn("[PacientesRepository] Erro ao buscar histórico de notas:", err)
    return []
  }
}

/**
 * Garante que o médico possua cadastrado o paciente de teste
 * de 'Allan Miranda Severo Rodrigues' com valor de consulta R$ 0,01,
 * permitindo a conciliação automática do PIX de 1 centavo enviado para a conta conectada do médico.
 */
export async function ensureOnboardingDoctorPatient(
  medicoId: string,
  patientName: string = PACIENTE_ONBOARDING_TESTE.nome,
  patientDoc: string = PACIENTE_ONBOARDING_TESTE.cnpj,
  patientEmail: string = PACIENTE_ONBOARDING_TESTE.email
): Promise<{ success: boolean; paciente?: Paciente; error?: string }> {
  if (!medicoId) {
    return { success: false, error: "ID do médico não informado." }
  }

  const targetName = (patientName || PACIENTE_ONBOARDING_TESTE.nome).trim()
  const targetDoc = (patientDoc || PACIENTE_ONBOARDING_TESTE.cnpj).replace(/\D/g, "")
  const targetEmail = patientEmail || PACIENTE_ONBOARDING_TESTE.email

  if (isSupabaseConfigured) {
    try {
      // 1. Busca se já existe o paciente de teste do médico
      const { data: list, error: fetchErr } = await supabase
        .from("pacientes")
        .select("*")
        .eq("medico_id", medicoId)

      if (fetchErr) {
        console.warn("[PacientesRepository] Erro ao listar pacientes do médico:", fetchErr)
      }

      const existing = list?.find(
        (p) =>
          p.cpf === targetDoc ||
          Number(p.valor_consulta) === 0.01 ||
          (p.nome && p.nome.toLowerCase().includes("allan")) ||
          (p.nome && p.nome.toLowerCase().includes("33 841 732"))
      )

      if (existing?.id) {
        const { data: updated, error: updateErr } = await supabase
          .from("pacientes")
          .update({
            nome: targetName,
            cpf: targetDoc,
            email: targetEmail,
            valor_consulta: 0.01,
            arquivado: false,
          })
          .eq("id", existing.id)
          .select()
          .single()

        if (updateErr) {
          console.warn("[PacientesRepository] Erro ao atualizar paciente onboarding:", updateErr)
        } else if (updated) {
          return { success: true, paciente: updated as Paciente }
        }
      }

      // 2. Cria novo paciente de teste caso não exista
      const { data: created, error: insertErr } = await supabase
        .from("pacientes")
        .insert({
          medico_id: medicoId,
          nome: targetName,
          cpf: targetDoc,
          email: targetEmail,
          valor_consulta: 0.01,
          arquivado: false,
        })
        .select()
        .single()

      if (insertErr) {
        console.error("[PacientesRepository] Erro ao criar paciente onboarding:", insertErr)
        return { success: false, error: insertErr.message }
      }

      return { success: true, paciente: created as Paciente }
    } catch (err) {
      console.error("[PacientesRepository] Exceção ao garantir paciente onboarding:", err)
      return {
        success: false,
        error: err instanceof Error ? err.message : "Erro ao registrar paciente do médico.",
      }
    }
  }

  return { success: true }
}
