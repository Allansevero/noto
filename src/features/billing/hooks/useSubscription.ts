import { useState, useEffect, useMemo, useCallback } from "react";
import type { Plan, Subscription, BillingInvoice, UsageQuota } from "../types";
import {
  getPlans,
  getActiveSubscription,
  getBillingInvoices,
} from "../billing.repository";
import { calculateUsageQuota } from "../services/billing.service";
import { useDoctors } from "@/features/doctors/hooks/useDoctors";
import { usePatients } from "@/features/patients/hooks/usePatients";

export function useSubscription() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [invoices, setInvoices] = useState<BillingInvoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { allDoctors } = useDoctors();
  const { allPatients } = usePatients();

  // Contagem de notas emitidas no mês atual
  const notasMesAtualCount = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return allPatients.filter((p) => {
      if (p.status !== "Nota Gerada" && p.status !== "Processando emissão") return false;
      const dataStr = p.data_nota_gerada || p.nfse_data_emissao || p.data_criacao;
      if (!dataStr) return false;
      const d = new Date(dataStr);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).length;
  }, [allPatients]);

  const loadBillingData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [fetchedPlans, fetchedSub, fetchedInvoices] = await Promise.all([
        getPlans(),
        getActiveSubscription(),
        getBillingInvoices(),
      ]);

      setPlans(fetchedPlans);
      setSubscription(fetchedSub);
      setInvoices(fetchedInvoices);
    } catch (err) {
      console.error("Erro ao carregar dados de assinatura do Supabase:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBillingData();
  }, [loadBillingData]);

  // Cálculo da cota atual
  const quota: UsageQuota = useMemo(() => {
    if (!subscription) {
      return {
        cnpjsUsados: allDoctors.length,
        cnpjsLimite: 0,
        cnpjsPercentual: 0,
        notasUsadas: notasMesAtualCount,
        notasLimite: 0,
        notasPercentual: 0,
        diasParaVencimento: 0,
        estaProximoDoVencimento: false,
        atingiuLimiteCnpjs: allDoctors.length > 0,
        atingiuLimiteNotas: notasMesAtualCount > 0,
      };
    }

    return calculateUsageQuota(subscription, allDoctors.length, notasMesAtualCount);
  }, [subscription, allDoctors.length, notasMesAtualCount]);

  const statusNormalized = subscription?.status?.toLowerCase().trim() || "";
  const hasActiveSubscription = Boolean(
    subscription && (statusNormalized === "ativa" || statusNormalized === "ativo" || statusNormalized === "trial")
  );

  return {
    plans,
    subscription,
    hasActiveSubscription,
    invoices,
    quota,
    isLoading,
    refetch: loadBillingData,
  };
}
