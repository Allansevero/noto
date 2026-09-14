import { NextResponse } from "next/server"
import Stripe from "stripe"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { planType, periodo, medicosTotal, valor, medicoId, doctorEmail, doctorName } = body

    if (!valor || valor <= 0) {
      return NextResponse.json({ error: "Valor inválido" }, { status: 400 })
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY

    // Modo de Simulação / Desenvolvimento caso as chaves da Stripe ainda não tenham sido configuradas no .env
    if (!stripeKey || stripeKey === "your-stripe-secret-key") {
      return NextResponse.json({
        clientSecret: `mock_secret_${Date.now()}`,
        isLive: false,
        amount: Math.round(valor * 100),
        currency: "brl",
        message: "Stripe em modo sandbox/mock ativo. Adicione STRIPE_SECRET_KEY no .env para transações reais em produção.",
      })
    }

    // Inicialização da SDK oficial da Stripe
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2025-02-24.acacia" as any,
    })

    const amountInCents = Math.round(valor * 100)

    // Cria PaymentIntent nativo para Pix e Cartão de Crédito
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "brl",
      payment_method_types: ["card"],
      metadata: {
        medico_id: medicoId || "",
        plan_type: planType || "medico",
        periodo: periodo || "mensal",
        medicos_total: String(medicosTotal || 1),
        doctor_email: doctorEmail || "",
        doctor_name: doctorName || "",
      },
      description: `Assinatura NotoMed - ${planType === "medico" ? "Plano Médico" : "Plano Secretária Virtual"}`,
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      id: paymentIntent.id,
      isLive: true,
      amount: amountInCents,
      currency: "brl",
    })
  } catch (err: unknown) {
    console.error("[Stripe Create Payment Intent Error]:", err)
    const errorMessage = err instanceof Error ? err.message : "Erro ao inicializar checkout Stripe"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
