"use client"

import * as React from "react"
import { Check, X, ShieldCheck } from "lucide-react"

interface ComparisonRow {
  recurso: string
  descricao?: string
  medicoMensal: string | boolean
  medicoAnual: string | boolean
  secretaria: string | boolean
  destaque?: boolean
}

const comparisonData: ComparisonRow[] = [
  {
    recurso: "NotoMed via Open Finance",
    descricao: "Conciliação bancária automática com emissão inteligente",
    medicoMensal: true,
    medicoAnual: true,
    secretaria: true,
    destaque: true,
  },
  {
    recurso: "Emissão de Notas Fiscais Reais (NFS-e)",
    descricao: "Válida juridicamente na prefeitura da sua cidade",
    medicoMensal: true,
    medicoAnual: true,
    secretaria: true,
    destaque: true,
  },
  {
    recurso: "Notas Fiscais Inclusas por Mês",
    medicoMensal: "200 notas",
    medicoAnual: "200 notas",
    secretaria: "600 notas (200/médico)",
  },
  {
    recurso: "Valor da Nota Extra",
    medicoMensal: "R$ 0,15",
    medicoAnual: "R$ 0,15",
    secretaria: "R$ 0,15",
  },
  {
    recurso: "Armazenamento em Nuvem das Notas",
    descricao: "Período em que o paciente pode consultar o link da nota",
    medicoMensal: "90 dias",
    medicoAnual: "12 meses (1 ano)",
    secretaria: "90 dias",
    destaque: true,
  },
  {
    recurso: "Médicos Atendidos",
    medicoMensal: "1 médico",
    medicoAnual: "1 médico",
    secretaria: "3 médicos inclusos (+R$ 102,90/médico)",
  },
  {
    recurso: "Acesso de Computador Individual por Médico",
    medicoMensal: false,
    medicoAnual: false,
    secretaria: true,
  },
  {
    recurso: "Contas Bancárias Conectadas",
    medicoMensal: "Ilimitadas",
    medicoAnual: "Ilimitadas",
    secretaria: "Ilimitadas por médico",
  },
  {
    recurso: "Pacientes Cadastrados",
    medicoMensal: "Ilimitados",
    medicoAnual: "Ilimitados",
    secretaria: "Ilimitados",
  },
  {
    recurso: "Acesso para Secretárias / Equipe",
    medicoMensal: "Até 2 secretárias",
    medicoAnual: "Até 2 secretárias",
    secretaria: "Até 2 membros extras na equipe",
  },
  {
    recurso: "Clínicas Cadastradas",
    medicoMensal: "Até 2 clínicas",
    medicoAnual: "Até 2 clínicas",
    secretaria: "Ilimitadas por médico",
  },
  {
    recurso: "Acesso Dedicado para Contador",
    medicoMensal: "1 contador",
    medicoAnual: "1 contador",
    secretaria: "Por médico",
  },
  {
    recurso: "Disparo Automático (WhatsApp & E-mail)",
    medicoMensal: true,
    medicoAnual: true,
    secretaria: true,
  },
  {
    recurso: "Relatórios Fiscais & Conciliação",
    medicoMensal: true,
    medicoAnual: true,
    secretaria: true,
  },
]

export function PlanComparisonTable() {
  const renderCellContent = (value: string | boolean) => {
    if (typeof value === "boolean") {
      return value ? (
        <div className="flex items-center justify-center">
          <div className="size-5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Check className="size-3.5 stroke-[2.5]" />
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center">
          <div className="size-5 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-400 flex items-center justify-center">
            <X className="size-3.5 stroke-[2]" />
          </div>
        </div>
      )
    }

    return (
      <span className="font-semibold text-xs sm:text-sm text-neutral-800 dark:text-neutral-200">
        {value}
      </span>
    )
  }

  return (
    <div className="w-full mt-12 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-lg">
      <div className="p-6 border-b border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">
            <ShieldCheck className="size-4" />
            <span>Transparência Total</span>
          </div>
          <h3 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white font-[family-name:var(--font-manrope,sans-serif)]">
            Comparativo Completo dos Planos
          </h3>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Veja exatamente o que cada plano recebe para tomar a melhor decisão para sua rotina.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[650px]">
          <thead>
            <tr className="border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-800/40 text-xs text-neutral-500 dark:text-neutral-400 uppercase font-semibold">
              <th className="py-4 px-6 w-2/5">Recurso</th>
              <th className="py-4 px-4 text-center w-1/5">Médico Mensal</th>
              <th className="py-4 px-4 text-center w-1/5 bg-emerald-500/5 text-emerald-800 dark:text-emerald-300">
                Médico Anual (-33%)
              </th>
              <th className="py-4 px-4 text-center w-1/5">Secretária Virtual</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 text-sm">
            {comparisonData.map((row, idx) => (
              <tr
                key={idx}
                className={`transition-colors hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 ${
                  row.destaque ? "bg-emerald-500/[0.03]" : ""
                }`}
              >
                <td className="py-3.5 px-6">
                  <div className="font-medium text-neutral-900 dark:text-white text-xs sm:text-sm">
                    {row.recurso}
                  </div>
                  {row.descricao && (
                    <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                      {row.descricao}
                    </div>
                  )}
                </td>
                <td className="py-3.5 px-4 text-center">
                  {renderCellContent(row.medicoMensal)}
                </td>
                <td className="py-3.5 px-4 text-center bg-emerald-500/5">
                  {renderCellContent(row.medicoAnual)}
                </td>
                <td className="py-3.5 px-4 text-center">
                  {renderCellContent(row.secretaria)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
