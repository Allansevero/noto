import { NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: Request) {
  const stripeKey = process.env.STRIPE_SECRET_KEY
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!stripeKey) {
    return NextResponse.json({ received: true, note: "Stripe key not configured" })
  }

  const stripe = new Stripe(stripeKey, {
    apiVersion: "2025-02-24.acacia" as any,
  })

  const signature = request.headers.get("stripe-signature")
  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Missing stripe signature or webhook secret" }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    const rawBody = await request.text()
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Webhook signature verification failed"
    console.error("[Stripe Webhook Error]:", msg)
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  // Instância do Supabase para atualização server-side
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    ""

  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        const medicoId = paymentIntent.metadata?.medico_id

        if (medicoId) {
          // Atualiza assinatura para ativa no Supabase
          await supabase.from("assinaturas").upsert(
            {
              medico_id: medicoId,
              status: "ativa",
              stripe_subscription_id: paymentIntent.id,
              data_inicio: new Date().toISOString().split("T")[0],
              dia_vencimento: 5,
            },
            { onConflict: "medico_id" }
          )

          // Atualiza o médico para status ativo
          await supabase
            .from("medicos")
            .update({ status: "ativo" })
            .eq("id", medicoId)

          console.log(`[Stripe Webhook] Médico ${medicoId} ativado com sucesso após pagamento!`)
        }
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        if (customerId) {
          await supabase
            .from("assinaturas")
            .update({ status: "cancelada" })
            .eq("stripe_subscription_id", subscription.id)
        }
        break
      }

      default:
        // Outros eventos
        break
    }

    return NextResponse.json({ received: true })
  } catch (err: unknown) {
    console.error("[Stripe Webhook Processing Error]:", err)
    return NextResponse.json({ error: "Failed to process webhook" }, { status: 500 })
  }
}
