import { supabase } from "@/lib/supabase/client";
import type { Plan, Subscription, BillingInvoice } from "./types";
import { DEFAULT_PLANS } from "./constants";

const PLANS_TABLE = "planos";
const SUBSCRIPTIONS_TABLE = "assinaturas";
const INVOICES_TABLE = "faturas_cobranca";

export const CHECKOUT_URLS: Record<string, string> = {
  basico: "https://invoice.infinitepay.io/plans/respiru/HwvkqORyco",
  profissional: "https://invoice.infinitepay.io/plans/respiru/aZnWNexG3Y",
  agencia: "https://invoice.infinitepay.io/plans/respiru/1JNDry40A2",
};

/**
 * Busca todos os planos cadastrados no Supabase com links de checkout garantidos
 */
export async function getPlans(): Promise<Plan[]> {
  try {
    const { data, error } = await (supabase as any)
      .from(PLANS_TABLE)
      .select("*")
      .order("ordem", { ascending: true });

    if (error || !data || data.length === 0) {
      return DEFAULT_PLANS;
    }

    return data.map((row: any) => {
      const defaultPlan = DEFAULT_PLANS.find((p) => p.id === row.id);
      return {
        ...defaultPlan,
        ...row,
        checkout_url: row.checkout_url || CHECKOUT_URLS[row.id] || defaultPlan?.checkout_url,
      };
    }) as Plan[];
  } catch {
    return DEFAULT_PLANS;
  }
}

/**
 * Busca a assinatura ativa do usuário atual no Supabase.
 * Retorna null se o usuário ainda não possuir assinatura gravada no banco de dados.
 */
export async function getActiveSubscription(): Promise<Subscription | null> {
  try {
    const { data: authData } = await supabase.auth.getUser();
    const currentUserId = authData?.user?.id;

    let query = (supabase as any)
      .from(SUBSCRIPTIONS_TABLE)
      .select("*, planos(*)")
      .order("created_at", { ascending: false });

    if (currentUserId) {
      query = query.eq("user_id", currentUserId);
    }

    const { data, error } = await query.limit(1);

    if (error || !data || data.length === 0) {
      return null;
    }

    const row = data[0] as any;
    const allPlans = await getPlans();
    const matchedPlan = allPlans.find((p) => p.id === row.plano_id) || row.planos || allPlans[1];

    return {
      id: row.id,
      user_id: row.user_id,
      plano_id: row.plano_id,
      status: row.status || "ativa",
      data_inicio: row.data_inicio,
      data_vencimento: row.data_vencimento,
      data_proxima_cobranca: row.data_proxima_cobranca || row.data_vencimento,
      metodo_pagamento: row.metodo_pagamento || "PIX",
      cnpjs_utilizados: row.cnpjs_utilizados ?? 0,
      notas_emitidas_mes_atual: row.notas_emitidas_mes_atual ?? 0,
      plano: matchedPlan,
    };
  } catch (err) {
    console.error("Erro ao buscar assinatura ativa no Supabase:", err);
    return null;
  }
}

/**
 * Busca histórico real de faturas da tabela faturas_cobranca no Supabase
 */
export async function getBillingInvoices(): Promise<BillingInvoice[]> {
  try {
    const { data, error } = await (supabase as any)
      .from(INVOICES_TABLE)
      .select("*")
      .order("data_emissao", { ascending: false });

    if (error || !data) {
      return [];
    }

    return data as unknown as BillingInvoice[];
  } catch (err) {
    console.error("Erro ao buscar faturas no Supabase:", err);
    return [];
  }
}
