"use client"

import * as React from "react"
import { Check, Sparkles, Shield, Building2, Users, Database, FileText, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { BillingPeriod } from "../types"

interface PlanCardProps {
  periodo: BillingPeriod
  onPeriodoChange: (p: BillingPeriod) => void
  onSelectPlan: (planDetails: { tipo: "medico"; periodo: BillingPeriod; valor: number }) => void
}

export function PlanCard({ periodo, onPeriodoChange, onSelectPlan }: PlanCardProps) {
  const isAnual = periodo === "anual"
  const valorMensal = isAnual ? 99.0 : 147.0
  const valorAnualTotal = 1188.0

  return (
    <div className="relative flex flex-col justify-between rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 sm:p-8 shadow-xl transition-all duration-300 hover:shadow-2xl hover:border-emerald-500/40">
      {/* Badge de Destaque / Melhor Escolha */}
      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 backdrop-blur-md">
          <Sparkles className="size-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Mais Escolhido por Médicos</span>
        </div>
      </div>

      <div>
        {/* Cabeçalho do Plano */}
        <div className="flex items-start justify-between gap-4 mt-2">
          <div>
            <h3 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white font-[family-name:var(--font-manrope,sans-serif)]">
              Plano Médico
            </h3>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              Ideal para consultórios e clínicas individuais com emissão automatizada.
            </p>
          </div>
        </div>

        {/* Alternador Mensal / Anual */}
        <div className="mt-5 p-1 bg-neutral-100 dark:bg-neutral-800/80 rounded-xl flex items-center gap-1">
          <button
            type="button"
            onClick={() => onPeriodoChange("mensal")}
            className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              !isAnual
                ? "bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm"
                : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
            }`}
          >
            Mensal
          </button>
          <button
            type="button"
            onClick={() => onPeriodoChange("anual")}
            className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              isAnual
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
            }`}
          >
            <span>Anual</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${isAnual ? "bg-white/20 text-white" : "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400"}`}>
              -33% OFF
            </span>
          </button>
        </div>

        {/* Preço */}
        <div className="mt-6 flex items-baseline gap-2">
          <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">R$</span>
          <span className="text-4xl sm:text-5xl font-extrabold tracking-tight text-neutral-900 dark:text-white font-[family-name:var(--font-manrope,sans-serif)]">
            {valorMensal.toFixed(2).replace(".", ",")}
          </span>
          <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">/mês</span>
        </div>

        {isAnual ? (
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">
            Faturado anualmente em R$ {valorAnualTotal.toFixed(2).replace(".", ",")} (Economia de R$ 576,00/ano)
          </p>
        ) : (
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Cobrança mensal sem fidelidade, cancele quando quiser.
          </p>
        )}

        {/* Destaque Open Finance */}
        <div className="mt-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-3 flex items-center gap-3">
          <div className="size-8 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0 text-white shadow-sm">
            <Shield className="size-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
              NotoMed via Open Finance
            </div>
            <div className="text-[11px] text-emerald-700/80 dark:text-emerald-400/90 leading-tight">
              Conciliação bancária em tempo real e emissão instantânea
            </div>
          </div>
        </div>

        {/* Lista de Recursos */}
        <div className="mt-6 space-y-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
          <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
            O que está incluso:
          </div>

          <ul className="space-y-2.5 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300">
            <li className="flex items-start gap-2.5">
              <div className="size-4 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="size-3 stroke-[2.5]" />
              </div>
              <div>
                <span className="font-semibold text-neutral-900 dark:text-white">200 notas fiscais/mês</span> inclusas
                <span className="block text-[11px] text-neutral-500">(R$ 0,15 por nota extra ou pacote avulso)</span>
              </div>
            </li>

            <li className="flex items-center gap-2.5">
              <div className="size-4 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Check className="size-3 stroke-[2.5]" />
              </div>
              <div>
                <span className="font-semibold text-neutral-900 dark:text-white">Armazenamento em nuvem:</span>{" "}
                {isAnual ? (
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">12 meses salvos</span>
                ) : (
                  <span>90 dias de acesso do paciente</span>
                )}
              </div>
            </li>

            <li className="flex items-center gap-2.5">
              <div className="size-4 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Check className="size-3 stroke-[2.5]" />
              </div>
              <div>
                <span className="font-semibold text-neutral-900 dark:text-white">Contas bancárias ilimitadas</span>
              </div>
            </li>

            <li className="flex items-center gap-2.5">
              <div className="size-4 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Check className="size-3 stroke-[2.5]" />
              </div>
              <div>
                <span className="font-semibold text-neutral-900 dark:text-white">Pacientes ilimitados</span>
              </div>
            </li>

            <li className="flex items-center gap-2.5">
              <div className="size-4 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Check className="size-3 stroke-[2.5]" />
              </div>
              <div>
                Até <span className="font-semibold text-neutral-900 dark:text-white">2 secretárias</span> com acesso
              </div>
            </li>

            <li className="flex items-center gap-2.5">
              <div className="size-4 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Check className="size-3 stroke-[2.5]" />
              </div>
              <div>
                Até <span className="font-semibold text-neutral-900 dark:text-white">2 clínicas</span> cadastradas
              </div>
            </li>

            <li className="flex items-center gap-2.5">
              <div className="size-4 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Check className="size-3 stroke-[2.5]" />
              </div>
              <div>
                <span className="font-semibold text-neutral-900 dark:text-white">1 contador</span> com painel dedicado
              </div>
            </li>

            <li className="flex items-center gap-2.5">
              <div className="size-4 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Check className="size-3 stroke-[2.5]" />
              </div>
              <div>
                Envio automático por <span className="font-semibold text-neutral-900 dark:text-white">WhatsApp</span> e <span className="font-semibold text-neutral-900 dark:text-white">E-mail</span>
              </div>
            </li>

            <li className="flex items-center gap-2.5">
              <div className="size-4 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Check className="size-3 stroke-[2.5]" />
              </div>
              <div>
                Relatórios fiscais e conciliação financeira
              </div>
            </li>
          </ul>
        </div>
      </div>

      {/* Botão de Aquisição */}
      <div className="mt-8 pt-4 border-t border-neutral-200 dark:border-neutral-800">
        <Button
          onClick={() =>
            onSelectPlan({
              tipo: "medico",
              periodo,
              valor: isAnual ? valorAnualTotal : valorMensal,
            })
          }
          className="w-full h-12 rounded-2xl font-bold text-sm bg-[#B7F20B] hover:bg-[#a6db09] text-neutral-950 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Emitir Notas Reais com Plano Médico</span>
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}
