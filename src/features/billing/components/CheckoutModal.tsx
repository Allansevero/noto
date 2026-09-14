"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ShieldCheck, CheckCircle2, Sparkles } from "lucide-react"
import { activateDoctorSubscription } from "../billing.repository"
import { useEnvironment } from "@/context/environment-context"
import { StripeCustomCheckout } from "./StripeCustomCheckout"

export interface SelectedPlanDetails {
  tipo: "medico" | "secretaria"
  periodo?: "mensal" | "anual"
  medicosTotal?: number
  medicosExtras?: number
  notasTotal?: number
  valor: number
}

interface CheckoutModalProps {
  isOpen: boolean
  onClose: () => void
  planDetails: SelectedPlanDetails | null
  medicoId?: string
  doctorEmail?: string
  doctorName?: string
}

export function CheckoutModal({
  isOpen,
  onClose,
  planDetails,
  medicoId,
  doctorEmail,
  doctorName,
}: CheckoutModalProps) {
  const router = useRouter()
  const { setAmbiente } = useEnvironment()
  const [isSuccess, setIsSuccess] = React.useState(false)

  if (!planDetails) return null

  const isMedico = planDetails.tipo === "medico"
  const title = isMedico
    ? `Plano Médico (${planDetails.periodo === "anual" ? "Anual" : "Mensal"})`
    : `Plano Secretária Virtual (${planDetails.medicosTotal} médicos)`

  const handlePaymentSuccess = async () => {
    try {
      if (medicoId) {
        const planoId = "4fc762f7-7409-4c68-a843-a385195215c0"
        await activateDoctorSubscription(medicoId, planoId, "cartao")
      }

      // Ativa o modo de produção no ambiente local
      setAmbiente("producao")
      setIsSuccess(true)

      setTimeout(() => {
        onClose()
        router.push("/dashboard/notas")
      }, 2000)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 sm:p-7 shadow-2xl overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="size-4" />
            <span>Checkout Seguro NotoMed</span>
          </div>
          <DialogTitle className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white font-[family-name:var(--font-manrope,sans-serif)]">
            {isSuccess ? "Assinatura Confirmada!" : "Finalizar Assinatura"}
          </DialogTitle>
          <DialogDescription className="text-xs text-neutral-500 dark:text-neutral-400">
            {isSuccess
              ? "Seu ambiente de produção com emissão real foi ativado."
              : "Conclua o pagamento para começar a emitir notas fiscais com valor legal."}
          </DialogDescription>
        </DialogHeader>

        {isSuccess ? (
          <div className="py-10 flex flex-col items-center justify-center text-center space-y-4">
            <div className="size-20 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center animate-bounce">
              <CheckCircle2 className="size-12 stroke-[2.5]" />
            </div>
            <p className="font-extrabold text-xl text-neutral-900 dark:text-white">
              Parabéns! Modo de Produção Ativado.
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm">
              Sua conta agora emite notas fiscais reais autorizadas pela SEFIN/Prefeitura.
              As notas de teste do Sandbox foram arquivadas.
            </p>
            <div className="pt-2 text-xs text-emerald-600 font-semibold animate-pulse">
              Redirecionando para o módulo de Notas Fiscais...
            </div>
          </div>
        ) : (
          <div className="space-y-5 py-2">
            {/* Resumo do Plano Selecionado */}
            <div className="rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 block">
                    Plano selecionado
                  </span>
                  <span className="text-sm font-bold text-neutral-900 dark:text-white">
                    {title}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 block">
                    Total
                  </span>
                  <span className="text-lg font-extrabold text-neutral-900 dark:text-white font-[family-name:var(--font-manrope,sans-serif)]">
                    R$ {planDetails.valor.toFixed(2).replace(".", ",")}
                  </span>
                </div>
              </div>

              {isMedico && planDetails.periodo === "anual" && (
                <div className="mt-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <Sparkles className="size-3" />
                  <span>12 meses de armazenamento em nuvem incluso</span>
                </div>
              )}

              {!isMedico && (
                <div className="mt-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <Sparkles className="size-3" />
                  <span>{planDetails.notasTotal} notas inclusas ({planDetails.medicosTotal} médicos)</span>
                </div>
              )}
            </div>

            {/* Checkout Nativo Stripe (Cartão ou Pix sem sair do site) */}
            <StripeCustomCheckout
              valor={planDetails.valor}
              planTitle={title}
              medicoId={medicoId}
              doctorEmail={doctorEmail}
              doctorName={doctorName}
              onPaymentSuccess={handlePaymentSuccess}
              onCancel={onClose}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
