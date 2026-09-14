import { NextRequest, NextResponse } from "next/server"
import { getServerSupabaseClient } from "@/lib/supabase/server"
import { PACIENTE_ONBOARDING_TESTE } from "@/config/constants"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const { medicoId, patientName, patientDoc, patientEmail } = body

    if (!medicoId) {
      return NextResponse.json(
        { success: false, error: "Parâmetro medicoId é obrigatório." },
        { status: 400 }
      )
    }

    const targetName = (patientName || PACIENTE_ONBOARDING_TESTE.nome).trim()
    const targetDoc = (patientDoc || PACIENTE_ONBOARDING_TESTE.cnpj).replace(/\D/g, "")
    const targetEmail = patientEmail || PACIENTE_ONBOARDING_TESTE.email

    const supabase = getServerSupabaseClient()

    // 1. Verifica se já existe paciente compatível cadastrado
    const { data: list, error: fetchErr } = await supabase
      .from("pacientes")
      .select("*")
      .eq("medico_id", medicoId)

    if (fetchErr) {
      console.warn("[API ensure-onboarding] Aviso ao buscar pacientes:", fetchErr.message)
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

      if (!updateErr && updated) {
        return NextResponse.json({ success: true, paciente: updated })
      }
    }

    // 2. Cria o paciente de teste com o client server-side
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
      console.error("[API ensure-onboarding] Erro ao inserir paciente:", insertErr.message || insertErr)
      return NextResponse.json(
        { success: false, error: insertErr.message || "Erro ao registrar paciente de onboarding." },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, paciente: created })
  } catch (err: unknown) {
    console.error("[API ensure-onboarding] Exceção:", err)
    return NextResponse.json(
      { success: false, error: "Erro interno ao garantir paciente de onboarding." },
      { status: 500 }
    )
  }
}
