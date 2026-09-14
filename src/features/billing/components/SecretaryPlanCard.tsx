"use client"

import * as React from "react"
import { Check, Shield, Plus, Minus, Users, Briefcase, Sparkles, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SecretaryPlanCardProps {
  onSelectPlan: (planDetails: {
    tipo: "secretaria"
    medicosTotal: number
    medicosExtras: number
    notasTotal: number
    valorTotal: number
  }) => void
}

export function SecretaryPlanCard({ onSelectPlan }: SecretaryPlanCardProps) {
  const [medicosExtras, setMedicosExtras] = React.useState(0)

  const medicosBase = 3
  const notasBase = 600
  const valorBase = 257.0
  const precoExtraPorMedico = 102.9
  const notasExtrasPorMedico = 200

  const medicosTotal = medicosBase + medicosExtras
  const notasTotal = notasBase + medicosExtras * notasExtrasPorMedico
  const valorTotalMensal = valorBase + medicosExtras * precoExtraPorMedico

  const handleIncrement = () => setMedicosExtras((prev) => prev + 1)
  const handleDecrement = () => setMedicosExtras((prev) => Math.max(0, prev - 1))

  return (
    <div className="relative flex flex-col justify-between rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 sm:p-8 shadow-xl transition-all duration-300 hover:shadow-2xl hover:border-emerald-500/40">
      {/* Badge de Destaque */}
      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-neutral-900 dark:bg-neutral-800 border border-neutral-700 px-3.5 py-1 text-xs font-semibold text-white backdrop-blur-md">
          <Briefcase className="size-3.5 text-[#B7F20B]" />
          <span>Plano Secretária Virtual</span>
        </div>
      </div>

      <div>
        {/* Cabeçalho do Plano */}
        <div className="flex items-start justify-between gap-4 mt-2">
          <div>
            <h3 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white font-[family-name:var(--font-manrope,sans-serif)]">
              Secretária & Assistente
            </h3>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              Gerencie múltiplos médicos simultaneamente com painéis e emissões individuais.
            </p>
          </div>
        </div>

        {/* Seletor Dinâmico de Médicos Atendidos */}
        <div className="mt-5 p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/60">
          <div className="flex items-center justify-between text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-2.5">
            <span>Médicos que você atende:</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
              {medicosTotal} médicos ({notasTotal} notas/mês)
            </span>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDecrement}
                disabled={medicosExtras === 0}
                title="Reduzir médico"
                className="size-9 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 flex items-center justify-center text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-sm"
              >
                <Minus className="size-4" />
              </button>

              <div className="min-w-[48px] text-center font-bold text-lg text-neutral-900 dark:text-white font-[family-name:var(--font-manrope,sans-serif)]">
                {medicosTotal}
              </div>

              <button
                type="button"
                onClick={handleIncrement}
                title="Adicionar mais um médico"
                className="size-9 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 flex items-center justify-center text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors cursor-pointer shadow-sm"
              >
                <Plus className="size-4" />
              </button>
            </div>

            <div className="text-right">
              {medicosExtras > 0 ? (
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold block">
                  +{medicosExtras} médico(s) (+R$ {(medicosExtras * precoExtraPorMedico).toFixed(2).replace(".", ",")})
                </span>
              ) : (
                <span className="text-[11px] text-neutral-500 block">
                  3 médicos inclusos no plano base
                </span>
              )}
              <span className="text-[10px] text-neutral-400 block">
                +200 notas por médico extra
              </span>
            </div>
          </div>
        </div>

        {/* Preço Mensal */}
        <div className="mt-5 flex items-baseline gap-2">
          <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">R$</span>
          <span className="text-4xl sm:text-5xl font-extrabold tracking-tight text-neutral-900 dark:text-white font-[family-name:var(--font-manrope,sans-serif)]">
            {valorTotalMensal.toFixed(2).replace(".", ",")}
          </span>
          <span className="text-sm font-medium text-neutral-500 dark:text-neutral-400">/mês</span>
        </div>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
          Base R$ 257 (3 médicos) + R$ 102,90 por médico extra
        </p>

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
              Sincronização bancária para cada médico da sua carteira
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
                <span className="font-semibold text-neutral-900 dark:text-white">{notasTotal} notas fiscais/mês</span> ({notasExtrasPorMedico} por médico)
                <span className="block text-[11px] text-neutral-500">(R$ 0,15 por nota extra)</span>
              </div>
            </li>

            <li className="flex items-center gap-2.5">
              <div className="size-4 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Check className="size-3 stroke-[2.5]" />
              </div>
              <div>
                <span className="font-semibold text-neutral-900 dark:text-white">Acesso do médico dedicado</span> (computador individual por médico)
              </div>
            </li>

            <li className="flex items-center gap-2.5">
              <div className="size-4 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Check className="size-3 stroke-[2.5]" />
              </div>
              <div>
                <span className="font-semibold text-neutral-900 dark:text-white">Até 90 dias</span> para armazenamento das notas fiscais
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
                Até <span className="font-semibold text-neutral-900 dark:text-white">2 membros extras</span> na sua equipe de secretárias
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
                Relatórios detalhados individuais por médico
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
              tipo: "secretaria",
              medicosTotal,
              medicosExtras,
              notasTotal,
              valorTotal: valorTotalMensal,
            })
          }
          className="w-full h-12 rounded-2xl font-bold text-sm bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-100 dark:text-neutral-950 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Emitir Notas Reais com Plano Secretária</span>
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}
