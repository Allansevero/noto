import { supabase } from "@/lib/supabase/client";
import type { Invoice, InvoiceStatus } from "./types";

const TABLE = "notas_fiscais";

/** Período de retenção de notas fiscais no sistema (90 dias) */
export const INVOICE_RETENTION_DAYS = 90;

/**
 * Busca todas as notas fiscais emitidas dentro da janela de retenção de 90 dias
 */
export async function fetchInvoices(): Promise<Invoice[]> {
  const ninetyDaysAgo = new Date(
    Date.now() - INVOICE_RETENTION_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();

  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select("*, pacientes(id, nome_completo, cpf, email, telefone), medicos(id, nome_completo, cnpj, crm, foto_perfil)")
      .gte("created_at", ninetyDaysAgo)
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("Aviso ao buscar notas fiscais:", error.message);
      return [];
    }

    return (data ?? []) as unknown as Invoice[];
  } catch (err) {
    console.warn("Erro ao buscar histórico de notas fiscais:", err);
    return [];
  }
}

/**
 * Salva ou atualiza uma nota fiscal com data de expiração calculada para 90 dias
 */
export async function saveInvoiceRecord(record: Partial<Invoice>): Promise<Invoice | null> {
  try {
    const ninetyDaysFuture = new Date(
      Date.now() + INVOICE_RETENTION_DAYS * 24 * 60 * 60 * 1000
    ).toISOString();

    const payload = {
      ...record,
      data_expiracao: ninetyDaysFuture,
    };

    const { data, error } = await supabase
      .from(TABLE)
      .upsert(payload as any, { onConflict: "focus_ref" })
      .select()
      .maybeSingle();

    if (error) {
      console.warn("Aviso ao salvar em notas_fiscais (tabela pode estar pendente de criação):", error.message);
      return null;
    }

    return data as unknown as Invoice;
  } catch (err) {
    console.warn("Erro ao registrar em notas_fiscais:", err);
    return null;
  }
}

export async function updateInvoiceStatus(
  focusRef: string,
  status: InvoiceStatus,
  updates: Partial<Invoice> = {}
): Promise<void> {
  try {
    await supabase
      .from(TABLE)
      .update({
        status,
        ...updates,
        updated_at: new Date().toISOString(),
      } as any)
      .eq("focus_ref", focusRef);
  } catch (err) {
    console.warn("Erro ao atualizar status da nota fiscal:", err);
  }
}
