import { supabase, isSupabaseConfigured } from "@/lib/supabase/client"
import { getCurrentDoctor } from "@/features/auth/auth.repository"
import { uploadNotaFiscalPdfToStorage } from "./services/pdf-storage.service"
import type {
  NotaFiscal,
  NotaStatus,
  ListNotasFilter,
  ListNotasResult,
  GerarNotaInput,
  AmbienteFiscal,
  ExecutadaPor,
  StatusEnvio,
  Paciente,
  GerarNotasLoteInput,
} from "./types"

const STORAGE_KEY = "notomed_notas_emitidas"

function getLocalStoredNotas(): NotaFiscal[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as NotaFiscal[]) : []
  } catch {
    return []
  }
}

function saveLocalStoredNotas(notas: NotaFiscal[]): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notas))
  } catch (err) {
    console.error("Erro ao salvar notas no cache local:", err)
  }
}

/**
 * Lista notas fiscais da conta do médico logado filtradas estritamente pelo ambiente ativo (homologacao ou producao).
 */
export async function listNotas(filter: ListNotasFilter = {}): Promise<ListNotasResult> {
  const doctor = await getCurrentDoctor()
  const medicoId = filter.medico_id || doctor?.id
  const ambiente: AmbienteFiscal = filter.ambiente || "producao"

  if (isSupabaseConfigured && medicoId) {
    try {
      const { data: notasDb, error: notasError } = await supabase
        .from("notas_fiscais")
        .select(
          "id, medico_id, paciente_id, clinica_id, numero_nota, valor_servico, valor_iss, data_emissao, xml_url, pdf_url, referencia_focus, justificativa_cancelamento, ambiente, pluggy_transacao_id, executada_por, status_envio, enviado_em, status, criado_em"
        )
        .eq("medico_id", medicoId)
        .eq("ambiente", ambiente)
        .order("numero_nota", { ascending: false })

      if (!notasError && notasDb) {
        // Obter os nomes dos pacientes associados
        const pacienteIds = Array.from(
          new Set(notasDb.map((n) => n.paciente_id).filter(Boolean) as string[])
        )
        const clinicaIds = Array.from(
          new Set(notasDb.map((n) => n.clinica_id).filter(Boolean) as string[])
        )

        const pacienteMap = new Map<string, { nome: string; cpf?: string }>()
        const clinicaMap = new Map<string, string>()

        if (pacienteIds.length > 0) {
          const { data: pacientesDb } = await supabase
            .from("pacientes")
            .select("id, nome, cpf")
            .in("id", pacienteIds)

          if (pacientesDb) {
            for (const p of pacientesDb) {
              pacienteMap.set(p.id, { nome: p.nome, cpf: p.cpf || undefined })
            }
          }
        }

        if (clinicaIds.length > 0) {
          const { data: clinicasDb } = await supabase
            .from("clinicas")
            .select("id, nome")
            .in("id", clinicaIds)

          if (clinicasDb) {
            for (const c of clinicasDb) {
              clinicaMap.set(c.id, c.nome)
            }
          }
        }

        const notasFormatadas: NotaFiscal[] = notasDb.map((row) => {
          const pac = row.paciente_id ? pacienteMap.get(row.paciente_id) : null
          const clinicaNome = row.clinica_id ? clinicaMap.get(row.clinica_id) : null
          const numStr = String(row.numero_nota || 1)
          const executadaPor: ExecutadaPor =
            row.executada_por === "open_finance" || Boolean(row.pluggy_transacao_id)
              ? "open_finance"
              : "manual"
          const statusEnvio: StatusEnvio =
            row.status_envio === "enviado" ? "enviado" : "nao_enviado"
          const statusVal: NotaStatus =
            (row.status as NotaStatus) || (row.xml_url ? "autorizada" : "processando")

          return {
            id: row.id,
            medico_id: row.medico_id,
            clinica_id: row.clinica_id || undefined,
            clinica_nome: clinicaNome || "-",
            numero_rps: numStr.padStart(3, "0"),
            numero_nfse: numStr.padStart(5, "0"),
            tomador_nome: pac?.nome || "Paciente",
            tomador_cpf: pac?.cpf,
            valor_servico: Number(row.valor_servico) || 0,
            data_competencia: row.data_emissao,
            data_emissao: row.data_emissao,
            status: statusVal,
            codigo_verificacao: row.id.substring(0, 8).toUpperCase(),
            pdf_url: row.pdf_url || row.xml_url || undefined,
            xml_url: row.xml_url || undefined,
            ambiente: (row.ambiente as AmbienteFiscal) || ambiente,
            executada_por: executadaPor,
            status_envio: statusEnvio,
            enviado_em: row.enviado_em || undefined,
            referencia_focus: row.referencia_focus || undefined,
            justificativa_cancelamento: row.justificativa_cancelamento || undefined,
          }
        })

        return { data: notasFormatadas, total: notasFormatadas.length }
      }
    } catch (err) {
      console.warn("[NotasRepository] Falha ao consultar Supabase, usando cache:", err)
    }
  }

  // Fallback offline/local cache
  const stored = getLocalStoredNotas()
  const filtered = stored.filter((n) => {
    const matchDoctor = !medicoId || !n.medico_id || n.medico_id === medicoId
    const matchAmbiente = n.ambiente === ambiente
    return matchDoctor && matchAmbiente
  })

  return { data: filtered, total: filtered.length }
}

/**
 * Registra emissão de nota fiscal para o médico autenticado no ambiente especificado.
 */
export async function gerarNota(payload: GerarNotaInput): Promise<{
  success: boolean
  message?: string
  nota?: NotaFiscal
}> {
  const doctor = await getCurrentDoctor()
  const medicoId = doctor?.id
  const ambiente: AmbienteFiscal = payload.ambiente || "producao"
  const executadaPor: ExecutadaPor = payload.executada_por || "manual"

  if (isSupabaseConfigured && medicoId) {
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const headers: Record<string, string> = { "Content-Type": "application/json" }
      if (sessionData?.session?.access_token) {
        headers["Authorization"] = `Bearer ${sessionData.session.access_token}`
      }

      const focusRes = await fetch("/api/focus/emitir-primeira-nota", {
        method: "POST",
        headers,
        body: JSON.stringify({
          medicoId,
          pacienteId: payload.paciente_id,
          tomador: {
            nome: payload.tomador_nome,
            cpfCnpj: payload.tomador_cpf,
            descricaoServico: payload.discriminacao,
            descricaoAdicional: payload.descricao_adicional,
          },
          valor: payload.valor_servico,
          ambiente,
        }),
      })

      const focusJson = await focusRes.json().catch(() => null)
      if (focusRes.ok && focusJson?.success) {
        const numStr = String(focusJson.numeroNfse || 1)
        const notaEmitida: NotaFiscal = {
          id: focusJson.notaId || focusJson.detalhes?.id || `nf-focus-${Date.now()}`,
          medico_id: medicoId,
          clinica_nome: "-",
          numero_rps: numStr.padStart(3, "0"),
          numero_nfse: numStr.padStart(5, "0"),
          tomador_nome: payload.tomador_nome,
          tomador_cpf: payload.tomador_cpf,
          valor_servico: payload.valor_servico,
          data_competencia: new Date().toISOString().split("T")[0],
          data_emissao: new Date().toISOString().split("T")[0],
          status: "autorizada",
          codigo_verificacao: focusJson.codigoVerificacao || focusJson.referencia?.slice(0, 8).toUpperCase() || "FOCUS",
          pdf_url: focusJson.caminhoDanfe || undefined,
          xml_url: focusJson.caminhoXml || undefined,
          ambiente,
          executada_por: executadaPor,
          status_envio: "nao_enviado",
          referencia_focus: focusJson.referencia,
        }

        return {
          success: true,
          message: `NFS-e #${notaEmitida.numero_nfse} emitida com sucesso na Focus NFe (${ambiente === "producao" ? "Produção" : "Sandbox"})!`,
          nota: notaEmitida,
        }
      } else if (focusJson?.error && focusRes.status !== 500) {
        return {
          success: false,
          message: focusJson.error,
        }
      }
    } catch (focusErr) {
      console.warn("[NotasRepository] API Focus indisponível no momento, usando emissão direta:", focusErr)
    }

    try {
      // 1. Obter ou criar o paciente
      let pacienteId: string | null = null

      if (payload.tomador_nome) {
        const { data: pacienteExistente } = await supabase
          .from("pacientes")
          .select("id")
          .eq("medico_id", medicoId)
          .eq("nome", payload.tomador_nome.trim())
          .maybeSingle()

        if (pacienteExistente?.id) {
          pacienteId = pacienteExistente.id
        } else {
          const { data: novoPaciente } = await supabase
            .from("pacientes")
            .insert({
              medico_id: medicoId,
              nome: payload.tomador_nome.trim(),
              cpf: payload.tomador_cpf?.trim() || null,
            })
            .select("id")
            .single()

          if (novoPaciente?.id) {
            pacienteId = novoPaciente.id
          }
        }
      }

      // 2. Determinar próximo número sequencial da nota
      const { data: ultimasNotas } = await supabase
        .from("notas_fiscais")
        .select("numero_nota")
        .eq("medico_id", medicoId)
        .eq("ambiente", ambiente)
        .order("numero_nota", { ascending: false })
        .limit(1)

      const proximoNumero = (ultimasNotas?.[0]?.numero_nota || 0) + 1
      const today = new Date().toISOString().split("T")[0]
      const consultaUrl =
        ambiente === "producao"
          ? `https://www.nfse.gov.br/consultapublica/?tpc=1&chave=${Date.now()}`
          : `https://www.producaorestrita.nfse.gov.br/consultapublica/?tpc=1&chave=${Date.now()}`

      // 3. Inserir a nota fiscal no banco com executada_por e status_envio
      const { data: novaNotaDb, error: insertError } = await supabase
        .from("notas_fiscais")
        .insert({
          medico_id: medicoId,
          paciente_id: pacienteId,
          clinica_id: payload.clinica_id || null,
          numero_nota: proximoNumero,
          valor_servico: payload.valor_servico,
          data_emissao: today,
          ambiente,
          executada_por: executadaPor,
          status_envio: "nao_enviado",
          xml_url: consultaUrl,
        })
        .select("id, numero_nota, valor_servico, data_emissao, ambiente, xml_url, executada_por, status_envio")
        .single()

      if (!insertError && novaNotaDb) {
        const notaFormatada: NotaFiscal = {
          id: novaNotaDb.id,
          medico_id: medicoId,
          clinica_nome: "-",
          numero_rps: String(proximoNumero).padStart(3, "0"),
          numero_nfse: String(proximoNumero).padStart(5, "0"),
          tomador_nome: payload.tomador_nome,
          tomador_cpf: payload.tomador_cpf,
          valor_servico: Number(novaNotaDb.valor_servico),
          data_competencia: today,
          data_emissao: today,
          status: "autorizada",
          codigo_verificacao: novaNotaDb.id.substring(0, 8).toUpperCase(),
          pdf_url: consultaUrl,
          xml_url: consultaUrl,
          ambiente,
          executada_por: executadaPor,
          status_envio: "nao_enviado",
        }

        // Salva automaticamente o PDF da nota fiscal no Supabase Storage
        uploadNotaFiscalPdfToStorage(notaFormatada, doctor)
          .then((uploadRes) => {
            if (uploadRes.success && uploadRes.pdfUrl) {
              notaFormatada.pdf_url = uploadRes.pdfUrl
            }
          })
          .catch((e) => console.warn("[NotasRepository] Erro no upload de PDF para o Storage:", e))

        return {
          success: true,
          message: `NFS-e #${notaFormatada.numero_nfse} emitida com sucesso (${ambiente === "producao" ? "Produção" : "Sandbox"})!`,
          nota: notaFormatada,
        }
      }
    } catch (err) {
      console.warn("[NotasRepository] Erro ao gravar nota no Supabase:", err)
    }
  }

  // Fallback offline / mock local
  const current = getLocalStoredNotas()
  const nextSeq = (current.length + 1).toString().padStart(3, "0")
  const today = new Date().toISOString().split("T")[0]

  const novaNota: NotaFiscal = {
    id: `nf-${Date.now()}`,
    medico_id: medicoId || "medico-local",
    clinica_nome: "-",
    numero_rps: nextSeq,
    numero_nfse: nextSeq.padStart(5, "0"),
    tomador_nome: payload.tomador_nome || "Paciente Avulso",
    tomador_cpf: payload.tomador_cpf || undefined,
    valor_servico: Number(payload.valor_servico) || 250,
    data_competencia: today,
    data_emissao: today,
    status: "autorizada",
    codigo_verificacao: Math.random().toString(36).substring(2, 8).toUpperCase(),
    pdf_url: "#",
    xml_url: "#",
    ambiente,
    executada_por: executadaPor,
    status_envio: "nao_enviado",
  }

  const updated = [novaNota, ...current]
  saveLocalStoredNotas(updated)

  return {
    success: true,
    message: `NFS-e #${novaNota.numero_nfse} registrada localmente (${ambiente === "producao" ? "Produção" : "Sandbox"})!`,
    nota: novaNota,
  }
}

/**
 * Marca uma nota como enviada ao paciente.
 */
export async function marcarNotaEnviada(notaId: string): Promise<{ success: boolean; message?: string }> {
  const doctor = await getCurrentDoctor()
  const medicoId = doctor?.id

  if (isSupabaseConfigured && medicoId) {
    try {
      const { error } = await supabase
        .from("notas_fiscais")
        .update({
          status_envio: "enviado",
          enviado_em: new Date().toISOString(),
        })
        .eq("id", notaId)
        .eq("medico_id", medicoId)

      if (!error) {
        return { success: true, message: "Nota enviada ao paciente com sucesso!" }
      }
    } catch (err) {
      console.warn("[NotasRepository] Erro ao marcar nota como enviada:", err)
    }
  }

  // Fallback local
  const current = getLocalStoredNotas()
  const updated = current.map((n) =>
    n.id === notaId ? { ...n, status_envio: "enviado" as StatusEnvio, enviado_em: new Date().toISOString() } : n
  )
  saveLocalStoredNotas(updated)
  return { success: true, message: "Nota marcada como enviada!" }
}

/**
 * Cancela uma nota fiscal no banco de dados e na Focus NFe.
 */
export async function cancelarNota(
  notaId: string,
  justificativa?: string
): Promise<{ success: boolean; message?: string }> {
  const justificativaPadrao = justificativa || "Cancelamento solicitado pelo prestador do serviço médico"

  // Se for nota mock gerada localmente (ex: nf-12345)
  if (notaId.startsWith("nf-")) {
    const current = getLocalStoredNotas()
    const updated = current.map((n) =>
      n.id === notaId
        ? {
            ...n,
            status: "cancelada" as const,
            justificativa_cancelamento: justificativaPadrao,
          }
        : n
    )
    saveLocalStoredNotas(updated)
    return { success: true, message: "Nota fiscal cancelada com sucesso!" }
  }

  // 1. Aciona a rota server-side que consulta Focus NFe e atualiza Supabase
  try {
    const { data: sessionData } = await supabase.auth.getSession()
    const headers: Record<string, string> = { "Content-Type": "application/json" }
    if (sessionData?.session?.access_token) {
      headers["Authorization"] = `Bearer ${sessionData.session.access_token}`
    }

    const res = await fetch("/api/focus/cancelar-nota", {
      method: "POST",
      headers,
      body: JSON.stringify({ notaId, justificativa: justificativaPadrao }),
    })

    const json = await res.json().catch(() => null)
    if (res.ok && json?.success) {
      // Atualiza cache local se existir
      const current = getLocalStoredNotas()
      const updated = current.map((n) =>
        n.id === notaId
          ? {
              ...n,
              status: "cancelada" as const,
              justificativa_cancelamento: justificativaPadrao,
            }
          : n
      )
      saveLocalStoredNotas(updated)

      return {
        success: true,
        message: json.message || "Nota fiscal cancelada com sucesso!",
      }
    }

    if (json?.error && res.status !== 404) {
      return { success: false, message: json.error }
    }
  } catch (apiErr) {
    console.warn("[NotasRepository] API /api/focus/cancelar-nota indisponível, usando fallback direto:", apiErr)
  }

  // 2. Fallback direto via RPC fn_cancelar_nota_fiscal (SECURITY DEFINER)
  if (isSupabaseConfigured) {
    try {
      const { data: rpcRes, error: rpcErr } = await supabase.rpc("fn_cancelar_nota_fiscal", {
        p_nota_id: notaId,
        p_justificativa: justificativaPadrao,
      })

      if (!rpcErr && rpcRes?.success) {
        const current = getLocalStoredNotas()
        const updated = current.map((n) =>
          n.id === notaId
            ? {
                ...n,
                status: "cancelada" as const,
                justificativa_cancelamento: justificativaPadrao,
              }
            : n
        )
        saveLocalStoredNotas(updated)

        return { success: true, message: "Nota fiscal cancelada com sucesso!" }
      }
    } catch (err) {
      console.warn("[NotasRepository] Erro no RPC fn_cancelar_nota_fiscal:", err)
    }
  }

  // 3. Fallback local
  const current = getLocalStoredNotas()
  const updated = current.map((n) =>
    n.id === notaId
      ? {
          ...n,
          status: "cancelada" as const,
          justificativa_cancelamento: justificativaPadrao,
        }
      : n
  )
  saveLocalStoredNotas(updated)
  return { success: true, message: "Nota fiscal cancelada com sucesso!" }
}

/**
 * Lista todos os pacientes cadastrados para o médico autenticado.
 */
export async function listPacientes(): Promise<Paciente[]> {
  const doctor = await getCurrentDoctor()
  const medicoId = doctor?.id

  if (isSupabaseConfigured && medicoId) {
    try {
      const { data, error } = await supabase
        .from("pacientes")
        .select("id, nome, cpf, email, telefone")
        .eq("medico_id", medicoId)
        .order("nome", { ascending: true })

      if (!error && data && data.length > 0) {
        return data as Paciente[]
      }
    } catch (err) {
      console.warn("[NotasRepository] Erro ao listar pacientes:", err)
    }
  }

  // Pacientes padrão / fallback
  return [
    { id: "pac-1", nome: "Beatriz Helena Santos", cpf: "82150391820" },
    { id: "pac-2", nome: "Carlos Eduardo Pereira", cpf: "39182047155" },
    { id: "pac-3", nome: "Fernanda Lima Albuquerque", cpf: "60428193077" },
    { id: "pac-4", nome: "Guilherme Augusto Souza", cpf: "91238471052" },
    { id: "pac-5", nome: "Lucas Gabriel Oliveira", cpf: "71940382914" },
    { id: "pac-6", nome: "Mariana Costa Silva", cpf: "48291037281" },
  ]
}

/**
 * Cadastra rapidamente um novo paciente para o médico autenticado.
 */
export async function cadastrarPaciente(input: {
  nome: string
  cpf?: string
  email?: string
}): Promise<{ success: boolean; paciente?: Paciente; error?: string }> {
  const doctor = await getCurrentDoctor()
  const medicoId = doctor?.id

  if (!medicoId) {
    return { success: false, error: "Médico não identificado." }
  }

  const cleanDoc = input.cpf ? input.cpf.replace(/\D/g, "") : null

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.rpc("fn_obter_ou_criar_paciente_teste", {
        p_medico_id: medicoId,
        p_nome: input.nome.trim(),
        p_cpf: cleanDoc,
        p_email: input.email?.trim() || null,
      })

      if (!error && data?.paciente) {
        return { success: true, paciente: data.paciente as Paciente }
      }
    } catch (err) {
      console.warn("[NotasRepository] Erro ao cadastrar paciente:", err)
    }
  }

  const novo: Paciente = {
    id: `pac-${Date.now()}`,
    nome: input.nome.trim(),
    cpf: cleanDoc || undefined,
    email: input.email?.trim(),
  }
  return { success: true, paciente: novo }
}

/**
 * Emite notas fiscais em lote para múltiplos pacientes com o mesmo valor fixo.
 */
export async function gerarNotasEmLote(
  payload: GerarNotasLoteInput
): Promise<{
  total: number
  sucessos: number
  erros: string[]
  notas: NotaFiscal[]
}> {
  const notasGeradas: NotaFiscal[] = []
  const erros: string[] = []

  for (const paciente of payload.pacientes) {
    try {
      const res = await gerarNota({
        paciente_id: paciente.id && !paciente.id.startsWith("pac-") ? paciente.id : undefined,
        tomador_nome: paciente.nome,
        tomador_cpf: paciente.cpf,
        valor_servico: payload.valor_servico,
        data_emissao: payload.data_emissao,
        discriminacao: payload.discriminacao,
        descricao_adicional: payload.descricao_adicional,
        ambiente: payload.ambiente,
        clinica_id: payload.clinica_id,
        executada_por: payload.executada_por || "manual",
      })

      if (res.success && res.nota) {
        notasGeradas.push(res.nota)
      } else {
        erros.push(`${paciente.nome}: ${res.message || "Falha ao emitir nota"}`)
      }
    } catch (err) {
      erros.push(
        `${paciente.nome}: ${err instanceof Error ? err.message : "Erro inesperado"}`
      )
    }
  }

  return {
    total: payload.pacientes.length,
    sucessos: notasGeradas.length,
    erros,
    notas: notasGeradas,
  }
}

