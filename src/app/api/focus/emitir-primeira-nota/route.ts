import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { PACIENTE_TESTE_STONE, FISCAL_DEFAULTS } from "@/config/constants"

export const dynamic = "force-dynamic"

function getMasterFocusToken(): string {
  return (process.env.FOCUS_NFE_TOKEN || "").trim()
}

function getFocusEnvironment(): "homologacao" | "producao" {
  const env = (process.env.FOCUS_NFE_ENVIRONMENT || "producao").trim().toLowerCase()
  return env === "homologacao" ? "homologacao" : "producao"
}

function formatToBrasiliaISO(d: Date): string {
  const utc = d.getTime() + d.getTimezoneOffset() * 60000
  const brDate = new Date(utc - 3 * 3600000)
  
  const yyyy = brDate.getFullYear()
  const mm = String(brDate.getMonth() + 1).padStart(2, "0")
  const dd = String(brDate.getDate()).padStart(2, "0")
  const hh = String(brDate.getHours()).padStart(2, "0")
  const min = String(brDate.getMinutes()).padStart(2, "0")
  const ss = String(brDate.getSeconds()).padStart(2, "0")

  return `${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}-0300`
}

/**
 * Obtém o token correto para o ambiente atual (homologação ou produção)
 * consultando os dados da empresa cadastrada na Focus NFe.
 */
async function getCompanyToken(
  focusEmpresaId?: string | null,
  cnpj?: string | null,
  requestedAmbiente?: "homologacao" | "producao"
): Promise<{
  tokenToUse: string
  baseUrl: string
  environment: "homologacao" | "producao"
}> {
  const env = requestedAmbiente || getFocusEnvironment()
  const masterToken = getMasterFocusToken()

  // Se o ambiente configurado for homologação, a URL base DEVE ser homologacao.focusnfe.com.br
  const baseUrl =
    env === "homologacao"
      ? "https://homologacao.focusnfe.com.br"
      : "https://api.focusnfe.com.br"

  if (env === "producao") {
    return { tokenToUse: masterToken, baseUrl, environment: "producao" }
  }

  // Em homologação, busca o token_homologacao específico da empresa na API central de empresas
  if (focusEmpresaId) {
    try {
      const authHeader = `Basic ${Buffer.from(`${masterToken}:`).toString("base64")}`
      const empRes = await fetch(`https://api.focusnfe.com.br/v2/empresas/${focusEmpresaId}`, {
        headers: { Authorization: authHeader },
      })
      if (empRes.ok) {
        const empData = await empRes.json()
        if (empData?.token_homologacao) {
          return {
            tokenToUse: empData.token_homologacao.trim(),
            baseUrl,
            environment: "homologacao",
          }
        }
      }
    } catch (err) {
      console.warn("[API Focus] Falha ao obter token_homologacao da empresa:", err)
    }
  }

  // Fallback: se não tiver focusEmpresaId, busca por lista de empresas
  if (cnpj) {
    try {
      const cnpjLimpo = cnpj.replace(/\D/g, "")
      const authHeader = `Basic ${Buffer.from(`${masterToken}:`).toString("base64")}`
      const listRes = await fetch("https://api.focusnfe.com.br/v2/empresas", {
        headers: { Authorization: authHeader },
      })
      if (listRes.ok) {
        const companies = await listRes.json()
        if (Array.isArray(companies)) {
          const match = companies.find((c: any) => c.cnpj === cnpjLimpo)
          if (match?.token_homologacao) {
            return {
              tokenToUse: match.token_homologacao.trim(),
              baseUrl,
              environment: "homologacao",
            }
          }
        }
      }
    } catch (e) {
      console.warn("[API Focus] Falha na busca por lista de empresas:", e)
    }
  }

  // Se falhar a busca do token da empresa, retorna o masterToken
  return { tokenToUse: masterToken, baseUrl, environment: "homologacao" }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const {
      medicoId,
      pacienteId: explicitPacienteId,
      tomador,
      valor = PACIENTE_TESTE_STONE.valorPadrao,
      transacaoId,
      dataPagamento,
      ambiente: requestedAmbiente,
    } = body

    if (!medicoId) {
      return NextResponse.json(
        {
          success: false,
          error: "Parâmetro medicoId não informado.",
        },
        { status: 400 }
      )
    }

    const masterToken = getMasterFocusToken()
    if (!masterToken) {
      return NextResponse.json(
        { success: false, error: "FOCUS_NFE_TOKEN não configurado no servidor (.env)." },
        { status: 500 }
      )
    }

    // 1. Instancia client do Supabase com o header do médico autenticado
    const authHeaderFromReq = request.headers.get("authorization") || ""
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://nzihhuvbwbidjwmmbfjr.supabase.co"
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: authHeaderFromReq ? { Authorization: authHeaderFromReq } : {},
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })

    // 2. Busca dados fiscais do médico via RPC no Supabase
    const { data: fiscalData } = await supabaseClient.rpc("fn_buscar_dados_fiscais", {
      p_medico_id: medicoId,
    })

    if (!fiscalData || !fiscalData.cnpj) {
      return NextResponse.json(
        {
          success: false,
          error: "Dados fiscais do médico não localizados no Supabase. Conclua os passos anteriores primeiro.",
        },
        { status: 400 }
      )
    }

    const prestadorCnpjLimpo = String(fiscalData.cnpj).replace(/\D/g, "")

    // 3. Determina URL e Token para o ambiente (Homologação / Sandbox vs Produção)
    const { tokenToUse, baseUrl, environment } = await getCompanyToken(
      fiscalData.focus_empresa_id,
      fiscalData.cnpj,
      requestedAmbiente
    )

    // 4. Validação estrita de Tomador em Produção (nenhum dado de teste permitido em produção)
    if (environment === "producao") {
      if (!tomador?.cpfCnpj || !tomador?.nome) {
        return NextResponse.json(
          {
            success: false,
            error: "Em ambiente de produção, dados reais do tomador (nome e CPF/CNPJ) são estritamente obrigatórios. Nenhum dado de teste ou padrão pode ser utilizado.",
          },
          { status: 400 }
        )
      }
      const rawDoc = tomador.cpfCnpj.replace(/\D/g, "")
      if (rawDoc === prestadorCnpjLimpo) {
        return NextResponse.json(
          {
            success: false,
            error: "Regra E0202 NFS-e: O tomador do serviço não pode ter o mesmo documento do prestador (médico).",
          },
          { status: 422 }
        )
      }
    }

    // Define dados do Tomador (dinâmico vindo da requisição ou fallback seguro apenas em homologação)
    let tomadorDocDigits = (tomador?.cpfCnpj || (environment === "homologacao" ? PACIENTE_TESTE_STONE.cnpj : "")).replace(/\D/g, "")
    let tomadorNome = (tomador?.nome || (environment === "homologacao" ? PACIENTE_TESTE_STONE.nome : "")).trim()

    if (environment === "homologacao" && tomadorDocDigits === prestadorCnpjLimpo) {
      tomadorDocDigits = PACIENTE_TESTE_STONE.cnpj
      tomadorNome = PACIENTE_TESTE_STONE.nome
    }

    const tomadorEmail = (tomador?.email || (environment === "homologacao" ? PACIENTE_TESTE_STONE.email : "")).trim()

    // 5. Cria ou obtém o registro do paciente no Supabase
    let pacienteId: string | null = explicitPacienteId && !explicitPacienteId.startsWith("pac-") ? explicitPacienteId : null

    if (!pacienteId && tomadorNome) {
      const { data: pacienteExistente } = await supabaseClient
        .from("pacientes")
        .select("id")
        .eq("medico_id", medicoId)
        .eq("nome", tomadorNome)
        .maybeSingle()

      if (pacienteExistente?.id) {
        pacienteId = pacienteExistente.id
      }
    }

    if (!pacienteId && tomadorDocDigits) {
      const { data: pacientePorDoc } = await supabaseClient
        .from("pacientes")
        .select("id")
        .eq("medico_id", medicoId)
        .eq("cpf", tomadorDocDigits)
        .maybeSingle()

      if (pacientePorDoc?.id) {
        pacienteId = pacientePorDoc.id
      }
    }

    if (!pacienteId) {
      try {
        const { data: pacienteRes } = await supabaseClient.rpc("fn_obter_ou_criar_paciente_teste", {
          p_medico_id: medicoId,
          p_nome: tomadorNome,
          p_cpf: tomadorDocDigits || null,
          p_email: tomadorEmail || null,
        })
        if (pacienteRes?.paciente?.id) {
          pacienteId = pacienteRes.paciente.id
        }
      } catch (errDb) {
        console.warn("[API Emitir Primeira Nota] Aviso ao registrar paciente no banco via RPC:", errDb)
      }
    }

    if (!pacienteId && tomadorNome) {
      const { data: novoPac } = await supabaseClient
        .from("pacientes")
        .insert({
          medico_id: medicoId,
          nome: tomadorNome,
          cpf: tomadorDocDigits || null,
          email: tomadorEmail || null,
        })
        .select("id")
        .maybeSingle()

      if (novoPac?.id) {
        pacienteId = novoPac.id
      }
    }

    // 5.1 Regra 2: Anti-duplicação (Idempotência Estrita)
    // Se a transação bancária já foi faturada para este médico, rejeita duplicação
    if (transacaoId) {
      const { data: notaExistente } = await supabaseClient
        .from("notas_fiscais")
        .select("id, numero_nota, data_emissao")
        .eq("medico_id", medicoId)
        .eq("pluggy_transacao_id", transacaoId)
        .maybeSingle()

      if (notaExistente) {
        console.warn(`[API Focus] Tentativa de emissão duplicada para transação ${transacaoId} (já possui NFS-e nº ${notaExistente.numero_nota})`)
        return NextResponse.json(
          {
            success: false,
            error: `Este pagamento já foi faturado anteriormente (NFS-e nº ${notaExistente.numero_nota} em ${notaExistente.data_emissao}). Emissão duplicada rejeitada por segurança fiscal.`,
            jaFaturado: true,
          },
          { status: 409 }
        )
      }
    }

    // 5.2 Regra 1: Compliance Fiscal em Produção
    // Nunca emitir notas de pagamentos anteriores ao registro do paciente no sistema
    if (environment === "producao" && dataPagamento && pacienteId) {
      const { data: pacienteRow } = await supabaseClient
        .from("pacientes")
        .select("criado_em")
        .eq("id", pacienteId)
        .maybeSingle()

      if (pacienteRow?.criado_em) {
        const dataCriacaoPaciente = new Date(pacienteRow.criado_em)
        const dataDoPagamento = new Date(dataPagamento)

        if (dataDoPagamento < dataCriacaoPaciente) {
          console.warn(`[API Focus] Bloqueio de compliance: Pagamento (${dataDoPagamento.toISOString()}) é anterior ao cadastro do paciente (${dataCriacaoPaciente.toISOString()}).`)
          return NextResponse.json(
            {
              success: false,
              error: `Pagamento recebido em ${dataDoPagamento.toLocaleString("pt-BR")} é anterior ao registro do paciente no sistema (${dataCriacaoPaciente.toLocaleString("pt-BR")}). Emissão bloqueada em produção por compliance fiscal.`,
            },
            { status: 422 }
          )
        }
      }
    }

    // 6. Prepara os dados para emissão da NFS-e Nacional na Focus NFe
    const pastDate = new Date(Date.now() - 2 * 60 * 1000)
    const dataEmissaoFormatada = formatToBrasiliaISO(pastDate)
    const dataCompetencia = dataEmissaoFormatada.split("T")[0]
    const prefixoAmbiente = environment === "producao" ? "notomed_prod" : "notomed_sandbox"
    const referencia = `${prefixoAmbiente}_${medicoId.replace(/-/g, "").slice(0, 8)}_${Date.now()}`

    const isCpf = tomadorDocDigits.length <= 11
    const municipioIbge = fiscalData.codigo_municipio_ibge || FISCAL_DEFAULTS.codigoMunicipioIbgePadrao

    const tomadorLogradouro = tomador?.logradouro || (environment === "homologacao" ? PACIENTE_TESTE_STONE.logradouro : "")
    const tomadorNumero = tomador?.numero || (environment === "homologacao" ? PACIENTE_TESTE_STONE.numero : "S/N")
    const tomadorBairro = tomador?.bairro || (environment === "homologacao" ? PACIENTE_TESTE_STONE.bairro : "Centro")
    const tomadorCep = (tomador?.cep || (environment === "homologacao" ? PACIENTE_TESTE_STONE.cep : "")).replace(/\D/g, "")
    const tomadorMunicipio = tomador?.codigoMunicipio || (environment === "homologacao" ? PACIENTE_TESTE_STONE.codigoMunicipio : municipioIbge)

    // Valores fiscais dinâmicos extraídos do cadastro ou XML do médico
    const codTribNac = fiscalData.codigo_tributacao_nacional || FISCAL_DEFAULTS.codigoTributacaoNacionalIss
    const codNbs = fiscalData.codigo_nbs || FISCAL_DEFAULTS.codigoNbs
    let descServico =
      tomador?.descricaoServico ||
      fiscalData.descricao_servico ||
      (environment === "producao"
        ? "Consulta médica e atendimento ambulatorial"
        : PACIENTE_TESTE_STONE.descricaoServico)

    if (tomador?.descricaoAdicional?.trim()) {
      const extra = tomador.descricaoAdicional.trim()
      if (!descServico.includes(extra)) {
        descServico = `${descServico} - ${extra}`
      }
    }

    const valorFinal = Number(valor) > 0 ? Number(valor) : (environment === "homologacao" ? PACIENTE_TESTE_STONE.valorPadrao : 0.01)

    const nfsenPayload: Record<string, any> = {
      data_emissao: dataEmissaoFormatada,
      data_competencia: dataCompetencia,
      codigo_municipio_emissora: municipioIbge,
      cnpj_prestador: prestadorCnpjLimpo,
      codigo_opcao_simples_nacional: 2, // ME/EPP Simples Nacional
      regime_especial_tributacao: 0,
      razao_social_tomador: environment === "homologacao" ? PACIENTE_TESTE_STONE.nome : tomadorNome,
      codigo_municipio_tomador: tomadorMunicipio,
      logradouro_tomador: tomadorLogradouro,
      numero_tomador: tomadorNumero,
      bairro_tomador: tomadorBairro,
      cep_tomador: tomadorCep,
      codigo_municipio_prestacao: municipioIbge,
      codigo_tributacao_nacional_iss: codTribNac,
      codigo_nbs: codNbs,
      descricao_servico: descServico,
      valor_servico: valorFinal,
      tributacao_iss: 1,
      tipo_retencao_iss: 1,
      indicador_total_tributacao: "0",
    }

    if (tomador?.descricaoAdicional?.trim()) {
      nfsenPayload.informacoes_adicionais_contribuinte = tomador.descricaoAdicional.trim()
    }

    if (environment === "homologacao") {
      nfsenPayload.cnpj_tomador = PACIENTE_TESTE_STONE.cnpj
      nfsenPayload.serie_dps = "2"
      nfsenPayload.numero_dps = (Math.floor(Date.now() / 1000) % 90000) + 1
    } else if (isCpf) {
      nfsenPayload.cpf_tomador = tomadorDocDigits
    } else {
      nfsenPayload.cnpj_tomador = tomadorDocDigits
    }

    if (tomadorEmail) {
      nfsenPayload.email_tomador = tomadorEmail
    }
    if (tomador?.telefone) {
      nfsenPayload.telefone_tomador = tomador.telefone.replace(/\D/g, "")
    }

    // 7. Envia para a Focus NFe em HOMOLOGAÇÃO
    const authHeader = `Basic ${Buffer.from(`${tokenToUse}:`).toString("base64")}`

    const focusSendRes = await fetch(`${baseUrl}/v2/nfsen?ref=${referencia}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify(nfsenPayload),
    })

    const sendData = await focusSendRes.json().catch(() => null)

    if (!focusSendRes.ok && focusSendRes.status !== 202) {
      let errorDetail = sendData?.mensagem || ""
      if (Array.isArray(sendData?.erros) && sendData.erros.length > 0) {
        errorDetail = sendData.erros
          .map((e: any) => (typeof e === "string" ? e : e.mensagem || JSON.stringify(e)))
          .join("; ")
      }
      return NextResponse.json(
        {
          success: false,
          error: errorDetail || `Erro ${focusSendRes.status} ao emitir na Focus NFe (${environment}).`,
          detalhes: sendData,
        },
        { status: focusSendRes.status }
      )
    }

    // 8. Consulta status para obter autorização em Homologação
    let currentStatus = sendData?.status || "processando_autorizacao"
    let noteData = sendData

    for (let attempt = 0; attempt < 5; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 2500))

      const checkRes = await fetch(`${baseUrl}/v2/nfsen/${referencia}`, {
        headers: { Authorization: authHeader },
      })
      const checkData = await checkRes.json().catch(() => null)

      if (checkRes.ok && checkData) {
        noteData = checkData
        currentStatus = checkData.status || currentStatus
        if (currentStatus === "autorizado" || currentStatus === "erro_autorizacao") {
          break
        }
      }
    }

    if (currentStatus === "erro_autorizacao") {
      let errorMsg = "Erro na autorização da nota fiscal de teste em homologação."
      if (Array.isArray(noteData?.erros) && noteData.erros.length > 0) {
        errorMsg = noteData.erros
          .map((e: any) => (typeof e === "string" ? e : e.mensagem || JSON.stringify(e)))
          .join("; ")
      }
      return NextResponse.json(
        {
          success: false,
          error: errorMsg,
          detalhes: noteData,
        },
        { status: 422 }
      )
    }

    const danfeUrl =
      noteData?.url_danfse ||
      (noteData?.caminho_danfe ? (noteData.caminho_danfe.startsWith("http") ? noteData.caminho_danfe : `${baseUrl}${noteData.caminho_danfe}`) : null)

    const xmlUrl =
      noteData?.url ||
      (noteData?.caminho_xml_nota_fiscal ? `${baseUrl}${noteData.caminho_xml_nota_fiscal}` : null) ||
      (noteData?.caminho_xml ? (noteData.caminho_xml.startsWith("http") ? noteData.caminho_xml : `${baseUrl}${noteData.caminho_xml}`) : null)

    const numeroNotaEmitida = String(noteData?.numero || noteData?.numero_rps || referencia)

    // 9. Salva registro na tabela notas_fiscais no Supabase com rastreamento da transação
    let notaFiscalRegistradaId: string | null = null
    let notaFiscalNumero: number | null = null

    if (pacienteId) {
      try {
        const parsedNum = parseInt(numeroNotaEmitida, 10)
        const numToSave = isNaN(parsedNum) || parsedNum <= 0 ? null : parsedNum

        const { data: regRes, error: regError } = await supabaseClient.rpc("fn_registrar_nota_fiscal", {
          p_medico_id: medicoId,
          p_paciente_id: pacienteId,
          p_numero_nota: numToSave,
          p_valor_servico: valorFinal,
          p_xml_url: xmlUrl || null,
          p_pluggy_transacao_id: transacaoId || null,
          p_data_pagamento: dataPagamento ? new Date(dataPagamento).toISOString() : null,
          p_ambiente: environment,
          p_referencia_focus: referencia,
          p_pdf_url: danfeUrl || null,
          p_status: "autorizada",
        })

        if (regError) {
          console.error("[API Emitir Primeira Nota] Aviso ao registrar via RPC fn_registrar_nota_fiscal:", regError)
          // Fallback resiliente: inserção direta na tabela notas_fiscais
          const { data: ultimasNotas } = await supabaseClient
            .from("notas_fiscais")
            .select("numero_nota")
            .eq("medico_id", medicoId)
            .order("numero_nota", { ascending: false })
            .limit(1)

          const proximoNumero = (ultimasNotas?.[0]?.numero_nota || 0) + 1

          const { data: directInsert, error: directErr } = await supabaseClient
            .from("notas_fiscais")
            .insert({
              medico_id: medicoId,
              paciente_id: pacienteId,
              numero_nota: proximoNumero,
              valor_servico: valorFinal,
              data_emissao: dataCompetencia,
              ambiente: environment,
              referencia_focus: referencia,
              pdf_url: danfeUrl || null,
              xml_url: xmlUrl || null,
              status: "autorizada",
              executada_por: transacaoId ? "open_finance" : "manual",
              status_envio: "nao_enviado",
            })
            .select("id, numero_nota")
            .maybeSingle()

          if (directErr) {
            console.error("[API Emitir Primeira Nota] Erro na inserção direta de notas_fiscais:", directErr)
          } else if (directInsert?.id) {
            notaFiscalRegistradaId = directInsert.id
            notaFiscalNumero = directInsert.numero_nota
          }
        } else if (regRes?.id) {
          notaFiscalRegistradaId = regRes.id
          notaFiscalNumero = regRes.numero_nota
        }
      } catch (errSave) {
        console.error("[API Emitir Primeira Nota] Erro inesperado ao salvar nota_fiscal:", errSave)
      }
    }

    const finalNumeroNfse = notaFiscalNumero ? String(notaFiscalNumero) : numeroNotaEmitida

    return NextResponse.json({
      success: true,
      ambiente: environment, // "homologacao" ou "producao"
      referencia,
      status: currentStatus,
      numeroNfse: finalNumeroNfse,
      notaId: notaFiscalRegistradaId,
      codigoVerificacao: noteData?.codigo_verificacao || null,
      caminhoDanfe: danfeUrl,
      caminhoXml: xmlUrl,
      transacaoId: transacaoId || null,
      dataPagamento: dataPagamento || null,
      paciente: {
        id: pacienteId,
        nome: tomadorNome,
        documento: tomadorDocDigits,
        email: tomadorEmail,
      },
      mensagem: `NFS-e emitida com sucesso no ambiente ${environment === "producao" ? "de Produção" : "Sandbox"}!`,
      detalhes: noteData,
    })
  } catch (err: unknown) {
    console.error("[API Emitir Primeira Nota] Erro:", err)
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Erro interno ao emitir NFS-e Nacional em homologação.",
      },
      { status: 500 }
    )
  }
}
