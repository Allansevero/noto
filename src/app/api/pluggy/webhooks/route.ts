import { NextRequest, NextResponse } from "next/server"
import {
  listPluggyWebhooks,
  registerPluggyWebhook,
} from "@/features/sync/services/pluggy-webhook.service"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const webhooks = await listPluggyWebhooks()
    return NextResponse.json({ success: true, webhooks })
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Erro ao consultar webhooks." },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const host = request.headers.get("host") || "localhost:3000"
    const proto = request.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https")
    const defaultUrl = `${proto}://${host}/api/webhooks/pluggy`

    const targetUrl = body.url || defaultUrl
    const event = body.event || "transactions/created"

    const result = await registerPluggyWebhook(targetUrl, event)
    return NextResponse.json(result, { status: result.success ? 200 : 400 })
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Erro ao registrar webhook." },
      { status: 500 }
    )
  }
}
