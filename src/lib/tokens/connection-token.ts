import crypto from "crypto"

const SECRET_KEY = process.env.NEXTAUTH_SECRET || process.env.SUPABASE_JWT_SECRET || "notomed-secretaria-banco-key-2026"

export interface ConnectionTokenPayload {
  medicoId: string
  secretariaEmail?: string
  secretariaNome?: string
  criadoEm: number
}

/**
 * Cria um token assinado e seguro para o médico conectar o banco.
 */
export function generateConnectionToken(payload: Omit<ConnectionTokenPayload, "criadoEm">): string {
  const data: ConnectionTokenPayload = {
    ...payload,
    criadoEm: Date.now(),
  }

  const jsonStr = JSON.stringify(data)
  const encoded = Buffer.from(jsonStr).toString("base64url")
  const signature = crypto
    .createHmac("sha256", SECRET_KEY)
    .update(encoded)
    .digest("base64url")

  return `${encoded}.${signature}`
}

/**
 * Valida o token assinado e retorna os dados decodificados.
 * Expiração padrão: 7 dias.
 */
export function verifyConnectionToken(token: string): ConnectionTokenPayload | null {
  try {
    const [encoded, signature] = token.split(".")
    if (!encoded || !signature) return null

    const expectedSignature = crypto
      .createHmac("sha256", SECRET_KEY)
      .update(encoded)
      .digest("base64url")

    if (signature !== expectedSignature) return null

    const jsonStr = Buffer.from(encoded, "base64url").toString("utf8")
    const payload: ConnectionTokenPayload = JSON.parse(jsonStr)

    // Expiração de 7 dias
    const maxAgeMs = 7 * 24 * 60 * 60 * 1000
    if (Date.now() - payload.criadoEm > maxAgeMs) {
      return null
    }

    return payload
  } catch {
    return null
  }
}
