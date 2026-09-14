import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"

// O endpoint de gestão de empresas (/v2/empresas) da Focus NFe reside exclusivamente em api.focusnfe.com.br
function getFocusBaseUrl(): string {
  return "https://api.focusnfe.com.br"
}

function getFocusToken(): string {
  return (process.env.FOCUS_NFE_TOKEN || "").trim()
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const medicoId = formData.get("medicoId") as string | null
    const password = formData.get("password") as string | null
    const certificateFile = formData.get("certificateFile") as File | null

    // 1. Validação dos parâmetros recebidos
    if (!medicoId) {
      return NextResponse.json(
        { success: false, error: "ID do médico não informado." },
        { status: 400 }
      )
    }

    if (!certificateFile) {
      return NextResponse.json(
        { success: false, error: "Arquivo do certificado A1 (.pfx ou .p12) não fornecido." },
        { status: 400 }
      )
    }

    if (!password || !password.trim()) {
      return NextResponse.json(
        { success: false, error: "Senha do certificado digital não informada." },
        { status: 400 }
      )
    }

    const token = getFocusToken()
    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: "FOCUS_NFE_TOKEN não configurado no servidor seguro (.env).",
        },
        { status: 500 }
      )
    }

    // 2. Cria client Supabase e busca os dados fiscais via RPC de segurança
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

    // Tenta primeiro via RPC com SECURITY DEFINER
    const { data: rpcData } = await supabaseClient.rpc("fn_buscar_dados_fiscais", {
      p_medico_id: medicoId,
    })

    let fiscalData = rpcData

    // Fallback: consulta direta se a RPC não retornou
    if (!fiscalData || !fiscalData.razao_social) {
      const { data: directData } = await supabaseClient
        .from("medico_dados_fiscais")
        .select("*")
        .eq("medico_id", medicoId)
        .maybeSingle()
      if (directData) {
        fiscalData = directData
      }
    }

    const { data: medico } = await supabaseClient
      .from("medicos")
      .select("id, nome_completo, cnpj")
      .eq("id", medicoId)
      .maybeSingle()

    if (!fiscalData || !fiscalData.razao_social) {
      return NextResponse.json(
        {
          success: false,
          error: "Dados fiscais do médico não localizados no Supabase. Por favor, suba a NFS-e no Passo 1 primeiro.",
        },
        { status: 400 }
      )
    }

    // Extrai o CNPJ dos dados fiscais, da razão social ou do médico
    let cnpjDigits = (fiscalData.cnpj || medico?.cnpj || "").replace(/\D/g, "")
    if (!cnpjDigits) {
      const matchCnpj = String(fiscalData.razao_social).match(/\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}|\d{14}/)
      if (matchCnpj) {
        cnpjDigits = matchCnpj[0].replace(/\D/g, "")
      }
    }

    if (!cnpjDigits) {
      return NextResponse.json(
        { success: false, error: "CNPJ da empresa do médico não localizado nos dados fiscais." },
        { status: 400 }
      )
    }

    // 3. Converte o arquivo do certificado A1 para Base64 em memória
    const arrayBuffer = await certificateFile.arrayBuffer()
    const base64Certificate = Buffer.from(arrayBuffer).toString("base64")

    // 4. Prepara o payload para a Focus NFe
    const isSimples =
      fiscalData.opcao_simples_nacional === "1" ||
      String(fiscalData.opcao_simples_nacional || "").toLowerCase().includes("simples")

    const focusPayload = {
      nome: fiscalData.razao_social || medico?.nome_completo,
      nome_fantasia: medico?.nome_completo || fiscalData.razao_social,
      cnpj: cnpjDigits,
      inscricao_municipal: fiscalData.inscricao_municipal || null,
      optante_simples_nacional: isSimples,
      regime_tributario: isSimples ? "1" : (fiscalData.opcao_simples_nacional || "3"),
      codigo_municipio: fiscalData.codigo_municipio_ibge || fiscalData.codigo_municipio_emissao || "4314902",
      municipio: fiscalData.municipio || "Porto Alegre",
      uf: fiscalData.uf ? fiscalData.uf.substring(0, 2).toUpperCase() : "RS",
      cep: (fiscalData.cep || "").replace(/\D/g, ""),
      logradouro: fiscalData.logradouro || "",
      numero: fiscalData.numero || "S/N",
      complemento: fiscalData.complemento || null,
      bairro: fiscalData.bairro || "",
      telefone: fiscalData.telefone || "",
      email: fiscalData.email || "",
      bssl: true,
      habilita_nfse: false,
      habilita_nfce: false,
      habilita_nfsen_producao: true,
      habilita_nfsen_homologacao: true,
      arquivo_certificado_base64: base64Certificate,
      senha_certificado: password.trim(),
      enviar_email_destinatario: false,
    }

    const baseUrl = getFocusBaseUrl()
    const authHeader = `Basic ${Buffer.from(`${token}:`).toString("base64")}`

    // 5. Tenta cadastrar ou atualizar a empresa na Focus NFe
    let focusResponse = await fetch(`${baseUrl}/v2/empresas`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify(focusPayload),
    })

    let responseData = await focusResponse.json().catch(() => null)

    // Se já existir (ou retornar código indicando existência prévia), tenta atualizar via PUT
    if (!focusResponse.ok && focusResponse.status === 422 && JSON.stringify(responseData || "").includes("já cadastrada")) {
      focusResponse = await fetch(`${baseUrl}/v2/empresas/${cnpjDigits}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify(focusPayload),
      })
      responseData = await focusResponse.json().catch(() => null)
    }

    if (!focusResponse.ok) {
      let errorDetail = responseData?.mensagem || ""
      if (Array.isArray(responseData?.erros) && responseData.erros.length > 0) {
        const list = responseData.erros.map((e: unknown) => {
          if (typeof e === "string") return e
          if (e && typeof e === "object") {
            const obj = e as { campo?: string; mensagem?: string }
            return obj.mensagem ? (obj.campo ? `${obj.campo}: ${obj.mensagem}` : obj.mensagem) : JSON.stringify(obj)
          }
          return String(e)
        })
        errorDetail = list.join("; ")
      }
      if (!errorDetail) {
        errorDetail = `Erro ${focusResponse.status} retornado pela Focus NFe.`
      }

      return NextResponse.json(
        {
          success: false,
          error: errorDetail,
          detalhes: responseData,
        },
        { status: focusResponse.status }
      )
    }

    // 6. Atualiza o status e ID da empresa na tabela medico_dados_fiscais no Supabase
    const focusEmpresaId = String(responseData?.id || responseData?.cnpj || cnpjDigits)
    const focusEmpresaStatus = String(responseData?.status || "autorizado")

    await supabaseClient.rpc("fn_atualizar_focus_empresa", {
      p_medico_id: medicoId,
      p_focus_empresa_id: focusEmpresaId,
      p_focus_empresa_status: focusEmpresaStatus,
    })

    await supabaseClient
      .from("medico_dados_fiscais")
      .update({
        focus_empresa_id: focusEmpresaId,
        focus_empresa_status: focusEmpresaStatus,
        certificado_validado_em: new Date().toISOString(),
        atualizado_em: new Date().toISOString(),
      })
      .eq("medico_id", medicoId)

    return NextResponse.json({
      success: true,
      empresaId: focusEmpresaId,
      status: focusEmpresaStatus,
      mensagem: "Empresa e Certificado Digital A1 homologados com sucesso na Focus NFe!",
    })
  } catch (err: unknown) {
    console.error("[API Focus Empresa] Erro interno:", err)
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Erro interno do servidor ao processar certificado na Focus NFe.",
      },
      { status: 500 }
    )
  }
}
