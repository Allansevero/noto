// Supabase Edge Function: focus-webhook
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.112.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Validar webhook secret se configurado
    const webhookSecret = Deno.env.get("FOCUS_WEBHOOK_SECRET");
    if (webhookSecret) {
      const authHeader = req.headers.get("Authorization") || req.headers.get("x-focus-webhook-secret");
      if (authHeader !== webhookSecret && authHeader !== `Bearer ${webhookSecret}`) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const payload = await req.json();
    console.log("[Focus Webhook Received]", JSON.stringify(payload, null, 2));

    const ref = payload.ref;
    if (!ref) {
      return new Response(JSON.stringify({ error: "Campo 'ref' ausente no webhook." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Conectar com o Supabase usando Service Role para atualizar os dados
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const statusFocus = payload.status; // 'autorizado', 'erro_autorizacao', 'cancelado', etc.

    if (statusFocus === "autorizado") {
      const pdfUrl = payload.caminho_danfe || payload.url_danfe || null;
      const xmlUrl = payload.caminho_xml_nota_fiscal || null;
      const numeroNota = payload.numero || null;
      const nowIso = new Date().toISOString();

      await supabaseClient
        .from("pacientes")
        .update({
          status: "Nota Gerada",
          nfse_numero: numeroNota,
          nfse_pdf_url: pdfUrl,
          nfse_xml_url: xmlUrl,
          nfse_data_emissao: nowIso,
          data_nota_gerada: nowIso,
          nfse_erro_motivo: null,
        })
        .eq("id", ref);

      console.log(`[Focus Webhook] Paciente ${ref} atualizado para 'Nota Gerada'. Nota Nº ${numeroNota}`);
    } else if (statusFocus === "erro_autorizacao" || payload.erros?.length > 0) {
      const errorMotivo =
        payload.mensagem_sefaz ||
        payload.erros?.[0]?.mensagem ||
        payload.mensagem ||
        "Rejeição no processamento da prefeitura.";

      await supabaseClient
        .from("pacientes")
        .update({
          status: "Erro na emissão",
          nfse_erro_motivo: errorMotivo,
        })
        .eq("id", ref);

      console.log(`[Focus Webhook] Paciente ${ref} atualizado para 'Erro na emissão'. Motivo: ${errorMotivo}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("[Focus Webhook Error]", err);
    return new Response(JSON.stringify({ error: err.message || "Erro no processamento do webhook." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
