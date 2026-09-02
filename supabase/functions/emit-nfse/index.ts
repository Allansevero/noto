// Supabase Edge Function: emit-nfse
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.112.4";
import { FocusNfeClient } from "../_shared/focusClient.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const { patientId } = await req.json();

    if (!patientId) {
      return new Response(
        JSON.stringify({ error: "patientId é obrigatório." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Buscar dados do paciente
    const { data: patient, error: patientErr } = await supabaseClient
      .from("pacientes")
      .select("*, medicos(*)")
      .eq("id", patientId)
      .single();

    if (patientErr || !patient) {
      return new Response(
        JSON.stringify({ error: "Paciente não encontrado." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const doctor = patient.medicos;
    const cleanDigits = (val?: string | null) => (val ? val.replace(/\D/g, "") : "");

    // 2. Montar payload conforme PRD
    const nowIso = new Date().toISOString();
    const todayFormatted = new Intl.DateTimeFormat("pt-BR").format(new Date());

    const isPJ = doctor?.tipo_emissor === "Pessoa Jurídica";
    const prestadorDoc = isPJ
      ? { cnpj: cleanDigits(doctor?.cnpj) }
      : { cpf: cleanDigits(doctor?.cpf) };

    const payload = {
      data_emissao: nowIso,
      natureza_operacao: "1", // 1 = tributação no município
      optante_simples_nacional: doctor?.optante_simples_nacional ?? true,
      regime_especial_tributacao: doctor?.regime_especial_tributacao || undefined,
      prestador: {
        ...prestadorDoc,
        inscricao_municipal: doctor?.inscricao_municipal || "12345",
        codigo_municipio: doctor?.codigo_municipio_ibge || "4314902", // Padrão ou configurado
      },
      tomador: {
        cpf: cleanDigits(patient.cpf),
        razao_social: patient.nome_completo,
        email: patient.email,
        telefone: cleanDigits(patient.telefone),
      },
      servico: {
        discriminacao: `Consulta médica realizada em ${todayFormatted}`,
        valor_servicos: Number(patient.valor_consulta),
        aliquota: Number(doctor?.aliquota_iss ?? 3.0),
        item_lista_servico: doctor?.item_lista_servico || "0401",
        codigo_tributario_municipio: doctor?.codigo_tributario_municipio || undefined,
        iss_retido: false,
      },
    };

    const focusClient = new FocusNfeClient();
    const tokenOverride = doctor?.focus_token || undefined;
    const ref = patient.id; // Ref única por paciente/emissão

    // 3. Disparar emissão na Focus NFe: POST /v2/nfse?ref={ref}
    const focusRes = await focusClient.post(`/v2/nfse?ref=${ref}`, payload, tokenOverride);

    // 4. Tratar resposta
    if (focusRes.ok || focusRes.status === 201 || focusRes.status === 200) {
      // Aceito na fila assíncrona -> muda para 'Processando emissão'
      await supabaseClient
        .from("pacientes")
        .update({
          status: "Processando emissão",
          focus_ref: ref,
          nfse_erro_motivo: null,
        })
        .eq("id", patient.id);

      return new Response(
        JSON.stringify({
          success: true,
          status: "Processando emissão",
          message: "Emissão enviada para processamento na prefeitura.",
          focusResponse: focusRes.data,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      // Erro síncrono de validação (400, 422, etc.)
      const errorMsg =
        focusRes.data?.mensagem ||
        focusRes.data?.erros?.[0]?.mensagem ||
        focusRes.data?.mensagem_sefaz ||
        "Falha na validação dos dados de emissão na Focus NFe.";

      await supabaseClient
        .from("pacientes")
        .update({
          status: "Erro na emissão",
          nfse_erro_motivo: errorMsg,
        })
        .eq("id", patient.id);

      return new Response(
        JSON.stringify({
          success: false,
          status: "Erro na emissão",
          error: errorMsg,
          details: focusRes.data,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || "Erro interno ao processar emissão." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
