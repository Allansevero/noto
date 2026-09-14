import { NextRequest, NextResponse } from "next/server"
import { getServerSupabaseClient } from "@/lib/supabase/server"
import { generateConnectionToken, verifyConnectionToken } from "@/lib/tokens/connection-token"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const { medicoId, secretariaNome, secretariaEmail } = body

    if (!medicoId) {
      return NextResponse.json(
        { success: false, error: "Parâmetro medicoId é obrigatório." },
        { status: 400 }
      )
    }

    const token = generateConnectionToken({
      medicoId,
      secretariaNome: secretariaNome || "Sua Secretária",
      secretariaEmail: secretariaEmail || undefined,
    })

    const origin = req.nextUrl.origin || "http://localhost:3000"
    const url = `${origin}/conectar-banco/${token}`

    return NextResponse.json({
      success: true,
      token,
      url,
    })
  } catch (err: unknown) {
    console.error("[API connection-link POST] Erro:", err)
    return NextResponse.json(
      { success: false, error: "Erro ao gerar link de conexão bancária." },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token")
    if (!token) {
      return NextResponse.json(
        { success: false, error: "Token não fornecido." },
        { status: 400 }
      )
    }

    const payload = verifyConnectionToken(token)
    if (!payload) {
      return NextResponse.json(
        { success: false, error: "Link de conexão inválido ou expirado." },
        { status: 401 }
      )
    }

    // Busca os dados do médico e contas bancárias já associadas
    const supabase = getServerSupabaseClient()
    const { data: medico, error: medicoError } = await supabase
      .from("medicos")
      .select("id, nome_completo, cnpj, status")
      .eq("id", payload.medicoId)
      .maybeSingle()

    if (medicoError || !medico) {
      return NextResponse.json(
        { success: false, error: "Médico não encontrado." },
        { status: 404 }
      )
    }

    const { data: contas } = await supabase
      .from("medico_contas_bancarias")
      .select("id, banco_nome, agencia, numero_conta, tipo_conta, status_conexao, criado_em")
      .eq("medico_id", payload.medicoId)

    const jaConectado = Boolean(contas && contas.length > 0)

    return NextResponse.json({
      success: true,
      medico: {
        id: medico.id,
        nome_completo: medico.nome_completo,
        cnpj: medico.cnpj,
      },
      secretaria: {
        nome: payload.secretariaNome || "Secretária Remota",
        email: payload.secretariaEmail,
      },
      jaConectado,
      contas: contas || [],
    })
  } catch (err: unknown) {
    console.error("[API connection-link GET] Erro:", err)
    return NextResponse.json(
      { success: false, error: "Erro ao validar link de conexão." },
      { status: 500 }
    )
  }
}
