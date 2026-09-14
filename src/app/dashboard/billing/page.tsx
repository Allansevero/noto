"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { PlanCard } from "@/features/billing/components/PlanCard"
import { SecretaryPlanCard } from "@/features/billing/components/SecretaryPlanCard"
import { PlanComparisonTable } from "@/features/billing/components/PlanComparisonTable"
import { CheckoutModal, type SelectedPlanDetails } from "@/features/billing/components/CheckoutModal"
import { getCurrentDoctor } from "@/features/auth/auth.repository"
import type { DoctorProfile } from "@/features/auth/types"
import type { BillingPeriod } from "@/features/billing/types"
import { Shield, Sparkles, HelpCircle, CheckCircle2, Lock } from "lucide-react"

function BillingContent() {
  const searchParams = useSearchParams()
  const reason = searchParams.get("reason")
  const [doctor, setDoctor] = React.useState<DoctorProfile | null>(null)
  const [periodoMedico, setPeriodoMedico] = React.useState<BillingPeriod>("anual")
  const [selectedPlan, setSelectedPlan] = React.useState<SelectedPlanDetails | null>(null)
  const [isCheckoutOpen, setIsCheckoutOpen] = React.useState(false)

  React.useEffect(() => {
    getCurrentDoctor().then((doc) => {
      if (doc) setDoctor(doc)
    })
  }, [])

  const handleSelectPlan = (plan: SelectedPlanDetails) => {
    setSelectedPlan(plan)
    setIsCheckoutOpen(true)
  }

  return (
    <div className="w-full max-w-6xl mx-auto py-6 sm:py-10 px-4 sm:px-6">
      {/* Aviso de Redirecionamento caso venha de 'Emitir notas reais' */}
      <div className="mb-8 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3 text-amber-900 dark:text-amber-300">
        <Lock className="size-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
        <div>
          <h4 className="text-sm font-bold">
            {reason === "upgrade" || true
              ? "Ativação de Emissão de Notas Fiscais Reais"
              : "Escolha seu plano para continuar"}
          </h4>
          <p className="text-xs text-amber-800/90 dark:text-amber-300/90 mt-0.5">
            Suas notas no Sandbox são apenas para validação técnica sem valor fiscal.
            Para assinar digitalmente com seu Certificado A1 e transmitir para a Prefeitura, escolha o plano desejado abaixo.
          </p>
        </div>
      </div>

      {/* Cabeçalho da Página */}
      <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/25 px-3.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-3">
          <Sparkles className="size-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>NotoMed Fiscal & Open Finance</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-neutral-900 dark:text-white font-[family-name:var(--font-manrope,sans-serif)]">
          Planos transparentes para você focar na medicina
        </h1>
        <p className="mt-3 text-sm sm:text-base text-neutral-600 dark:text-neutral-400">
          Sem burocracia, sem fidelidade forçada. Emita suas notas fiscais de forma 100% automatizada com conciliação bancária direta.
        </p>
      </div>

      {/* Grid de Cards dos Planos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
        <PlanCard
          periodo={periodoMedico}
          onPeriodoChange={setPeriodoMedico}
          onSelectPlan={(details) =>
            handleSelectPlan({
              tipo: "medico",
              periodo: details.periodo,
              valor: details.valor,
            })
          }
        />

        <SecretaryPlanCard
          onSelectPlan={(details) =>
            handleSelectPlan({
              tipo: "secretaria",
              medicosTotal: details.medicosTotal,
              medicosExtras: details.medicosExtras,
              notasTotal: details.notasTotal,
              valor: details.valorTotal,
            })
          }
        />
      </div>

      {/* Tabela Comparativa Detalhada */}
      <PlanComparisonTable />

      {/* Selo de Segurança e Open Finance */}
      <div className="mt-12 p-6 sm:p-8 rounded-3xl bg-neutral-900 dark:bg-neutral-950 text-white border border-neutral-800 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="flex items-start gap-4">
          <div className="size-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0 text-[#B7F20B]">
            <Shield className="size-6" />
          </div>
          <div>
            <h4 className="text-base font-bold font-[family-name:var(--font-manrope,sans-serif)]">
              Segurança Bancária e Fiscal de Nível Regulatório
            </h4>
            <p className="text-xs sm:text-sm text-neutral-400 mt-1 max-w-xl">
              Criptografia ponta a ponta com certificados digitais ICP-Brasil e conexões Open Finance autorizadas pelo Banco Central do Brasil.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 border border-neutral-700 text-xs text-neutral-300">
            <CheckCircle2 className="size-4 text-emerald-400" />
            <span>NFS-e Padrão Nacional</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 border border-neutral-700 text-xs text-neutral-300">
            <CheckCircle2 className="size-4 text-[#B7F20B]" />
            <span>Open Finance Ativo</span>
          </div>
        </div>
      </div>

      {/* Dúvidas Frequentes Rápidas */}
      <div className="mt-14 max-w-3xl mx-auto space-y-4">
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-neutral-900 dark:text-white font-[family-name:var(--font-manrope,sans-serif)]">
            Perguntas Frequentes
          </h3>
        </div>

        <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 bg-white dark:bg-neutral-900">
          <h5 className="text-sm font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
            <HelpCircle className="size-4 text-emerald-600 dark:text-emerald-400" />
            <span>Como funciona a emissão de notas fiscais reais?</span>
          </h5>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1.5 pl-6">
            Com seu Certificado Digital A1 cadastrado, o NotoMed assina digitalmente e transmite a nota para o servidor da sua Prefeitura (Focus NFe). A nota é homologada e o PDF/XML fica disponível imediatamente para você e seu paciente.
          </p>
        </div>

        <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 bg-white dark:bg-neutral-900">
          <h5 className="text-sm font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
            <HelpCircle className="size-4 text-emerald-600 dark:text-emerald-400" />
            <span>O que acontece se eu ultrapassar 200 notas no mês?</span>
          </h5>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1.5 pl-6">
            Você não fica bloqueado! Cada nota excedente custa apenas R$ 0,15 e é faturada no mês seguinte de forma transparente na fatura do seu plano.
          </p>
        </div>

        <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 bg-white dark:bg-neutral-900">
          <h5 className="text-sm font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
            <HelpCircle className="size-4 text-emerald-600 dark:text-emerald-400" />
            <span>Sou secretária e atendo médicos diferentes, como funciona?</span>
          </h5>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1.5 pl-6">
            No Plano Secretária Virtual, você começa com 3 médicos inclusos (600 notas/mês) e pode adicionar quantos médicos desejar por apenas R$ 102,90 cada. Cada médico tem sua conta e certificados isolados com total sigilo.
          </p>
        </div>
      </div>

      {/* Modal de Checkout */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        planDetails={selectedPlan}
        medicoId={doctor?.id}
        doctorEmail={doctor?.email}
        doctorName={doctor?.nome_completo}
      />
    </div>
  )
}

export default function BillingPage() {
  return (
    <React.Suspense fallback={
      <div className="w-full max-w-6xl mx-auto py-16 px-4 flex items-center justify-center">
        <div className="size-8 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
      </div>
    }>
      <BillingContent />
    </React.Suspense>
  )
}

