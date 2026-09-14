import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"

function getMasterFocusToken(): string {
  return (process.env.FOCUS_NFE_TOKEN || "").trim()
}

function getFocusEnvironment(): "homologacao" | "producao" {
  const env = (process.env.FOCUS_NFE_ENVIRONMENT || "producao").trim().toLowerCase()
  return env === "homologacao" ? "homologacao" : "producao"
}

/**
 * Obtém o token correto para o ambiente atual (homologação ou produção)
 * consultando os dados da empresa cadastrada na Focus NFe.
 */
async function getCompanyToken(
  focusEmpresaId?: string | null,
  cnpj?: string | null,
  ambiente?: "homologacao" | "producao"
): Promise<{
  tokenToUse: string
  baseUrl: string
  environment: "homologacao" | "producao"
}> {
  const env = ambiente || getFocusEnvironment()
  const masterToken = getMasterFocusToken()

  const baseUrl =
    env === "homologacao"
      ? "https://homologacao.focusnfe.com.br"
      : "https://api.focusnfe.com.br"

  if (env === "producao") {
    if (focusEmpresaId && masterToken) {
      try {
        const authHeader = `Basic ${Buffer.from(`${masterToken}:`).toString("base64")}`
        const empRes = await fetch(`https://api.focusnfe.com.br/v2/empresas/${focusEmpresaId}`, {
          headers: { Authorization: authHeader },
        })
        if (empRes.ok) {
          const empData = await empRes.json()
          if (empData?.token_producao) {
            return {
              tokenToUse: empData.token_producao.trim(),
              baseUrl,
              environment: "producao",
            }
          }
        }
      } catch (err) {
        console.warn("[API Focus Cancelar] Falha ao obter token_producao:", err)
      }
    }
    return { tokenToUse: masterToken, baseUrl, environment: "producao" }
  }

  // Em homologação, o host homologacao.focusnfe.com.br EXIGE o token_homologacao da empresa
  if (focusEmpresaId && masterToken) {
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
      console.warn("[API Focus Cancelar] Falha ao obter token_homologacao da empresa:", err)
    }
  }

  // Fallback por CNPJ
  if (cnpj && masterToken) {
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
      console.warn("[API Focus Cancelar] Falha na busca por lista de empresas:", e)
    }
  }

  return { tokenToUse: masterToken, baseUrl, environment: "homologacao" }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { notaId, justificativa } = body

    if (!notaId) {
      return NextResponse.json(
        { success: false, error: "Parâmetro notaId é obrigatório." },
        { status: 400 }
      )
    }

    // A justificativa na Focus NFe deve ter entre 15 e 255 caracteres
    const rawJustificativa = (justificativa || "Cancelamento solicitado pelo prestador do serviço médico").trim()
    const justificativaFinal =
      rawJustificativa.length < 15
        ? "Cancelamento solicitado pelo prestador do serviço médico"
        : rawJustificativa.slice(0, 255)

    // 1. Inicializa cliente do Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://nzihhuvbwbidjwmmbfjr.supabase.co"
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
    const authHeaderFromReq = request.headers.get("authorization") || ""

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: authHeaderFromReq ? { Authorization: authHeaderFromReq } : {},
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })

    // Se for nota mock gerada localmente (iniciada com 'nf-')
    if (String(notaId).startsWith("nf-")) {
      return NextResponse.json({
        success: true,
        message: "Nota fiscal local cancelada com sucesso!",
      })
    }

    // 2. Busca a nota fiscal no banco via RPC com SECURITY DEFINER
    const { data: nota, error: notaError } = await supabase.rpc("fn_obter_nota_fiscal", {
      p_nota_id: String(notaId),
    })

    if (notaError || !nota) {
      // Tenta cancelar diretamente via RPC mesmo sem carregar previamente
      const { data: directCancel } = await supabase.rpc("fn_cancelar_nota_fiscal", {
        p_nota_id: String(notaId),
        p_justificativa: justificativaFinal,
      })

      if (directCancel?.success) {
        return NextResponse.json({
          success: true,
          message: "Nota fiscal cancelada com sucesso!",
        })
      }

      return NextResponse.json(
        { success: false, error: "Nota fiscal não encontrada no banco de dados." },
        { status: 404 }
      )
    }

    if (nota.status === "cancelada") {
      return NextResponse.json({
        success: true,
        message: "Esta nota fiscal já se encontra cancelada.",
        jaCancelada: true,
      })
    }

    const ambienteNota: "homologacao" | "producao" =
      nota.ambiente === "producao" ? "producao" : "homologacao"

    // 3. Obtém dados fiscais do médico (focus_empresa_id e cnpj) para recuperar o token correto
    let focusEmpresaId: string | null = null
    let doctorCnpj: string | null = null

    if (nota.medico_id) {
      try {
        const { data: fiscalData } = await supabase.rpc("fn_buscar_dados_fiscais", {
          p_medico_id: nota.medico_id,
        })
        if (fiscalData) {
          focusEmpresaId = fiscalData.focus_empresa_id || null
          doctorCnpj = fiscalData.cnpj || null
        }
      } catch (errFisc) {
        console.warn("[API Focus Cancelar] Falha ao consultar dados fiscais:", errFisc)
      }
    }

    const { tokenToUse, baseUrl } = await getCompanyToken(focusEmpresaId, doctorCnpj, ambienteNota)

    // 4. Se a nota possui referência na Focus NFe, aciona a API externa com o token correto
    if (nota.referencia_focus) {
      try {
        const authHeader = `Basic ${Buffer.from(`${tokenToUse}:`).toString("base64")}`
        const ref = encodeURIComponent(nota.referencia_focus)

        console.log(`[API Focus Cancelar] Cancelando na Focus NFe: ${baseUrl}/v2/nfsen/${ref}`)

        // Tenta primeiro endpoint de NFS-e Nacional (/v2/nfsen/{ref})
        let focusRes = await fetch(`${baseUrl}/v2/nfsen/${ref}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: authHeader,
          },
          body: JSON.stringify({ justificativa: justificativaFinal }),
        })

        // Se retornar 404 na NFS-e Nacional, tenta endpoint municipal (/v2/nfse/{ref})
        if (focusRes.status === 404) {
          console.log(`[API Focus Cancelar] 404 em nfsen, tentando municipal: ${baseUrl}/v2/nfse/${ref}`)
          focusRes = await fetch(`${baseUrl}/v2/nfse/${ref}`, {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              Authorization: authHeader,
            },
            body: JSON.stringify({ justificativa: justificativaFinal }),
          })
        }

        const focusData = await focusRes.json().catch(() => null)
        console.log(`[API Focus Cancelar] Status HTTP: ${focusRes.status}, Resposta:`, focusData)

        if (focusRes.ok) {
          if (focusData?.status === "cancelado") {
            // Sucesso na Focus NFe -> atualiza Supabase
            await supabase.rpc("fn_cancelar_nota_fiscal", {
              p_nota_id: notaId,
              p_justificativa: justificativaFinal,
            })

            return NextResponse.json({
              success: true,
              message: "Nota fiscal cancelada com sucesso na Focus NFe e homologada!",
              focusStatus: "cancelado",
            })
          } else if (focusData?.status === "erro_cancelamento") {
            let errorDetail = "Erro ao cancelar nota perante a prefeitura/SEFAZ."
            if (Array.isArray(focusData?.erros) && focusData.erros.length > 0) {
              errorDetail = focusData.erros
                .map((e: any) => (typeof e === "string" ? e : e.mensagem || JSON.stringify(e)))
                .join("; ")
            }
            return NextResponse.json(
              {
                success: false,
                error: `Cancelamento rejeitado pela Focus NFe: ${errorDetail}`,
                detalhes: focusData,
              },
              { status: 422 }
            )
          }
        } else if (focusRes.status === 400) {
          return NextResponse.json(
            {
              success: false,
              error: focusData?.mensagem || "Nota não autorizada para cancelamento na Focus NFe.",
              detalhes: focusData,
            },
            { status: 400 }
          )
        } else if (focusRes.status === 404) {
          console.warn("[API Focus Cancelar] Nota não encontrada na Focus NFe, cancelando apenas no banco...")
          await supabase.rpc("fn_cancelar_nota_fiscal", {
            p_nota_id: notaId,
            p_justificativa: justificativaFinal,
          })

          return NextResponse.json({
            success: true,
            message: "Nota fiscal cancelada no sistema (não localizada nos servidores da Focus NFe).",
          })
        } else if (focusRes.status === 401 || focusRes.status === 403) {
          console.error("[API Focus Cancelar] Erro de autenticação:", focusData)
          return NextResponse.json(
            {
              success: false,
              error: `Erro de autenticação com a Focus NFe (${focusRes.status}): ${focusData?.mensagem || "Permissão negada"}.`,
              detalhes: focusData,
            },
            { status: 502 }
          )
        }
      } catch (focusErr) {
        console.warn("[API Focus Cancelar] Falha na comunicação com Focus NFe:", focusErr)
      }
    }

    // 5. Se não possui referência externa (ex: emitida antes ou offline), cancela diretamente no Supabase
    const { data: rpcRes, error: rpcError } = await supabase.rpc("fn_cancelar_nota_fiscal", {
      p_nota_id: notaId,
      p_justificativa: justificativaFinal,
    })

    if (rpcError) {
      await supabase
        .from("notas_fiscais")
        .update({
          status: "cancelada",
          cancelada_em: new Date().toISOString(),
          justificativa_cancelamento: justificativaFinal,
        })
        .eq("id", notaId)
    }

    return NextResponse.json({
      success: true,
      message: `NFS-e #${nota.numero_nota || ""} cancelada com sucesso no sistema!`,
    })
  } catch (err: unknown) {
    console.error("[API Cancelar Nota] Erro:", err)
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Erro interno ao processar cancelamento.",
      },
      { status: 500 }
    )
  }
}
