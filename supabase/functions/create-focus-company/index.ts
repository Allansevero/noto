// Supabase Edge Function: create-focus-company
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

    const { doctorId, dryRun } = await req.json();

    if (!doctorId) {
      return new Response(JSON.stringify({ error: "doctorId é obrigatório." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: doctor, error: doctorErr } = await supabaseClient
      .from("medicos")
      .select("*")
      .eq("id", doctorId)
      .single();

    if (doctorErr || !doctor) {
      return new Response(JSON.stringify({ error: "Médico não encontrado." }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cleanDigits = (val?: string | null) => (val ? val.replace(/\D/g, "") : "");
    const cnpjDigits = cleanDigits(doctor.cnpj);
    const cpfDigits = cleanDigits(doctor.cpf);
    const cepDigits = cleanDigits(doctor.endereco?.cep);
    const numParsed = parseInt(doctor.endereco?.numero || "100", 10) || 100;
    const cepParsed = cepDigits ? parseInt(cepDigits, 10) : 80210000;

    // Schema OpenAPI: EmpresaCreate
    const payload: Record<string, unknown> = {
      nome: doctor.razao_social || doctor.nome_completo,
      nome_fantasia: doctor.nome_fantasia || doctor.razao_social || doctor.nome_completo,
      bairro: doctor.endereco?.bairro || "Centro",
      cep: isNaN(cepParsed) ? 80210000 : cepParsed,
      complemento: doctor.endereco?.complemento || undefined,
      discrimina_impostos: true,
      email: doctor.email || "contato@clinica.com",
      enviar_email_destinatario: true,
      habilita_nfse: true,
      habilita_nfe: false,
      habilita_nfce: false,
      mostrar_danfse_badge: true,
      logradouro: doctor.endereco?.logradouro || "Rua Principal",
      numero: numParsed,
      municipio: doctor.endereco?.cidade || "Porto Alegre",
      uf: (doctor.endereco?.uf || "RS").toUpperCase(),
      regime_tributario: doctor.optante_simples_nacional ? 1 : 3,
      telefone: cleanDigits(doctor.telefone) || "51999999999",
    };

    if (cnpjDigits && cnpjDigits.length === 14) {
      payload.cnpj = cnpjDigits;
    } else if (cpfDigits && cpfDigits.length === 11) {
      payload.cpf = cpfDigits;
    }

    if (doctor.inscricao_municipal) {
      const imClean = cleanDigits(doctor.inscricao_municipal);
      payload.inscricao_municipal = imClean ? parseInt(imClean, 10) || doctor.inscricao_municipal : doctor.inscricao_municipal;
    }

    const focusClient = new FocusNfeClient();
    const endpoint = dryRun ? "/v2/empresas?dry_run=1" : "/v2/empresas";
    const response = await focusClient.post(endpoint, payload);

    if (response.ok || response.status === 200 || response.status === 201) {
      const focusToken = response.data?.token_homologacao || response.data?.token || response.data?.token_producao || "mock_token_empresa";
      const focusId = response.data?.id || response.data?.empresa_id || null;

      await supabaseClient
        .from("medicos")
        .update({
          focus_token: focusToken,
          focus_empresa_id: focusId ? String(focusId) : null,
        })
        .eq("id", doctor.id);

      return new Response(
        JSON.stringify({
          success: true,
          message: "Empresa criada com sucesso na Focus NFe.",
          focusEmpresa: response.data,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          error: response.data?.mensagem || "Erro ao cadastrar empresa na Focus NFe.",
          details: response.data,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || "Erro interno ao cadastrar empresa na Focus NFe." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
