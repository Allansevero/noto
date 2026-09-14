"use client"

import * as React from "react"
import { CreditCard, QrCode, Lock, CheckCircle2, Copy, Check, Loader2, Sparkles, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface StripeCustomCheckoutProps {
  valor: number
  planTitle: string
  medicoId?: string
  doctorEmail?: string
  doctorName?: string
  onPaymentSuccess: () => void
  onCancel: () => void
}

export function StripeCustomCheckout({
  valor,
  planTitle,
  medicoId,
  doctorEmail,
  doctorName,
  onPaymentSuccess,
  onCancel,
}: StripeCustomCheckoutProps) {
  const [metodo, setMetodo] = React.useState<"cartao" | "pix">("cartao")
  const [isLoading, setIsLoading] = React.useState(false)
  const [copiedPix, setCopiedPix] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)

  // Campos do Cartão
  const [cardNumber, setCardNumber] = React.useState("")
  const [cardHolder, setCardHolder] = React.useState(doctorName || "")
  const [cardExpiry, setCardExpiry] = React.useState("")
  const [cardCvc, setCardCvc] = React.useState("")
  const [cpfTitular, setCpfTitular] = React.useState("")

  // Formatação automática do cartão
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 16)
    const formatted = val.match(/.{1,4}/g)?.join(" ") || val
    setCardNumber(formatted)
  }

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 4)
    if (val.length >= 3) {
      setCardExpiry(`${val.slice(0, 2)}/${val.slice(2)}`)
    } else {
      setCardExpiry(val)
    }
  }

  const handleCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 4)
    setCardCvc(val)
  }

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 11)
    let formatted = val
    if (val.length > 9) {
      formatted = `${val.slice(0, 3)}.${val.slice(3, 6)}.${val.slice(6, 9)}-${val.slice(9)}`
    } else if (val.length > 6) {
      formatted = `${val.slice(0, 3)}.${val.slice(3, 6)}.${val.slice(6)}`
    } else if (val.length > 3) {
      formatted = `${val.slice(0, 3)}.${val.slice(3)}`
    }
    setCpfTitular(formatted)
  }

  // Detecta bandeira do cartão
  const getCardBrand = () => {
    const clean = cardNumber.replace(/\s/g, "")
    if (clean.startsWith("4")) return "Visa"
    if (/^5[1-5]/.test(clean)) return "Mastercard"
    if (/^3[47]/.test(clean)) return "Amex"
    if (/^(606282|4011|504175|509)/.test(clean)) return "Elo"
    return null
  }

  const mockPixCode = `00020126580014br.gov.bcb.pix0136${Date.now()}5204000053039865405${valor.toFixed(2)}5802BR5915NOTOMED SERVICOS6009SAO PAULO62070503***6304`

  const handleCopyPix = () => {
    navigator.clipboard.writeText(mockPixCode)
    setCopiedPix(true)
    setTimeout(() => setCopiedPix(false), 3000)
  }

  const handleProcessPayment = async () => {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      // 1. Chama nosso backend que comunica diretamente com a API da Stripe
      const res = await fetch("/api/billing/stripe/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planType: planTitle.includes("Médico") ? "medico" : "secretaria",
          valor,
          medicoId,
          doctorEmail,
          doctorName: cardHolder || doctorName,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Falha ao processar pagamento com a Stripe.")
      }

      // 2. Pagamento aprovado no backend
      // Dispara o callback de sucesso
      setTimeout(() => {
        setIsLoading(false)
        onPaymentSuccess()
      }, 1200)
    } catch (err: unknown) {
      console.error(err)
      setIsLoading(false)
      setErrorMessage(
        err instanceof Error ? err.message : "Ocorreu um erro no processamento do pagamento."
      )
    }
  }

  return (
    <div className="space-y-5">
      {/* Seletor de Método de Pagamento */}
      <div className="grid grid-cols-2 gap-2 p-1 bg-neutral-100 dark:bg-neutral-800/80 rounded-xl">
        <button
          type="button"
          onClick={() => setMetodo("cartao")}
          className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            metodo === "cartao"
              ? "bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs"
              : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
          }`}
        >
          <CreditCard className="size-4" />
          <span>Cartão de Crédito</span>
        </button>

        <button
          type="button"
          onClick={() => setMetodo("pix")}
          className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            metodo === "pix"
              ? "bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-xs"
              : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
          }`}
        >
          <QrCode className="size-4" />
          <span>Pix Instantâneo</span>
        </button>
      </div>

      {errorMessage && (
        <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
          <AlertCircle className="size-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Formulário de Cartão de Crédito Nativo */}
      {metodo === "cartao" && (
        <div className="space-y-3">
          {/* Número do Cartão */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                Número do Cartão
              </label>
              {getCardBrand() && (
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  {getCardBrand()}
                </span>
              )}
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="4000 0000 0000 0000"
                value={cardNumber}
                onChange={handleCardNumberChange}
                className="w-full h-10 px-3.5 pl-10 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-xs font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
              <CreditCard className="size-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Nome no Cartão */}
          <div>
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
              Nome impresso no Cartão
            </label>
            <input
              type="text"
              placeholder="Dr. Roberto Silva"
              value={cardHolder}
              onChange={(e) => setCardHolder(e.target.value)}
              className="w-full h-10 px-3.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-xs uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>

          {/* Validade + CVV */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                Validade
              </label>
              <input
                type="text"
                placeholder="MM/AA"
                value={cardExpiry}
                onChange={handleExpiryChange}
                className="w-full h-10 px-3.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
                Código CVC / CVV
              </label>
              <input
                type="password"
                placeholder="123"
                value={cardCvc}
                onChange={handleCvcChange}
                className="w-full h-10 px-3.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>
          </div>

          {/* CPF do Titular */}
          <div>
            <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">
              CPF do Titular
            </label>
            <input
              type="text"
              placeholder="000.000.000-00"
              value={cpfTitular}
              onChange={handleCpfChange}
              className="w-full h-10 px-3.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>
        </div>
      )}

      {/* Pix Nativo */}
      {metodo === "pix" && (
        <div className="space-y-4 text-center py-2">
          <div className="flex flex-col items-center justify-center p-4 bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 w-fit mx-auto shadow-sm">
            {/* QR Code Simulado / SVG NotoMed */}
            <div className="size-40 bg-neutral-900 text-white rounded-xl p-3 flex flex-col items-center justify-center relative overflow-hidden">
              <QrCode className="size-32 text-white" />
              <div className="absolute inset-0 bg-gradient-to-t from-emerald-600/30 to-transparent pointer-events-none" />
            </div>
            <span className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-2 font-medium">
              Abra o app do seu banco e escaneie o código
            </span>
          </div>

          <div>
            <button
              type="button"
              onClick={handleCopyPix}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-semibold text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 transition-colors cursor-pointer shadow-xs"
            >
              {copiedPix ? (
                <>
                  <Check className="size-3.5 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400">Código Pix Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="size-3.5" />
                  <span>Copiar Código Pix (Copia e Cola)</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Selo de Segurança Stripe */}
      <div className="flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400 pt-2 border-t border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-1.5">
          <Lock className="size-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Checkout Nativo Seguro</span>
        </div>
        <div className="font-semibold text-neutral-600 dark:text-neutral-300">
          Powered by Stripe API
        </div>
      </div>

      {/* Botões de Ação */}
      <div className="pt-2 flex items-center justify-between gap-3">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
          className="rounded-xl text-xs h-11 px-4 cursor-pointer"
        >
          Voltar
        </Button>

        <Button
          onClick={handleProcessPayment}
          disabled={isLoading}
          className="flex-1 rounded-xl text-xs h-11 font-bold bg-[#B7F20B] hover:bg-[#a6db09] text-neutral-950 flex items-center justify-center gap-2 cursor-pointer shadow-md"
        >
          {isLoading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              <span>Processando pela Stripe...</span>
            </>
          ) : (
            <>
              <span>Pagar R$ {valor.toFixed(2).replace(".", ",")} e Ativar</span>
              <Sparkles className="size-3.5" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
