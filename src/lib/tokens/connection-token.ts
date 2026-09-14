import crypto from "crypto"

const SECRET_KEY =
  process.env.NEXTAUTH_SECRET ||
  process.env.SUPABASE_JWT_SECRET ||
  "notomed-secretaria-banco-key-2026"

export interface ConnectionTokenPayload {
  medicoId: string
  secretariaEmail?: string
  secretariaNome?: string
  criadoEm: number
}

function formatUuidFromHex(hex: string): string {
  if (hex.length !== 32) return hex
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

/**
 * Cria um token assinado, compacto e elegante (prefixo ntm_) para o médico conectar o banco.
 * Evita formato feio ou suspeito de JWT base64 (eyJ...).
 */
export function generateConnectionToken(payload: Omit<ConnectionTokenPayload, "criadoEm">): string {
  const hex = payload.medicoId.replace(/-/g, "")
  if (hex.length === 32) {
    const idBuf = Buffer.from(hex, "hex")
    const timeBuf = Buffer.alloc(4)
    const timestampSec = Math.floor(Date.now() / 1000)
    timeBuf.writeUInt32BE(timestampSec, 0)

    const nameBuf = Buffer.from(payload.secretariaNome || "", "utf8")
    const nameLenBuf = Buffer.from([Math.min(nameBuf.length, 255)])
    const nameSliced = nameBuf.subarray(0, nameLenBuf[0])

    const dataBuf = Buffer.concat([idBuf, timeBuf, nameLenBuf, nameSliced])
    const signature = crypto
      .createHmac("sha256", SECRET_KEY)
      .update(dataBuf)
      .digest()
      .subarray(0, 10) // 80 bits de assinatura criptográfica

    const fullBuf = Buffer.concat([dataBuf, signature])
    return `ntm_${fullBuf.toString("base64url")}`
  }

  // Fallback se não for UUID padrão
  const data: ConnectionTokenPayload = {
    ...payload,
    criadoEm: Date.now(),
  }
  const jsonStr = JSON.stringify(data)
  const encoded = Buffer.from(jsonStr).toString("base64url")
  const sig = crypto.createHmac("sha256", SECRET_KEY).update(encoded).digest("base64url")
  return `ntm_${encoded}.${sig}`
}

/**
 * Valida o token assinado e retorna os dados decodificados.
 * Suporta o novo formato compacto `ntm_...` e também o formato legado.
 * Expiração padrão: 7 dias.
 */
export function verifyConnectionToken(rawToken: string): ConnectionTokenPayload | null {
  try {
    const token = (rawToken || "").trim()
    const maxAgeSec = 7 * 24 * 60 * 60

    // 1. Novo formato compacto: ntm_<base64url>
    if (token.startsWith("ntm_") && !token.includes(".")) {
      const b64 = token.slice(4)
      const buf = Buffer.from(b64, "base64url")
      if (buf.length < 16 + 4 + 1 + 10) return null

      const dataBuf = buf.subarray(0, buf.length - 10)
      const providedSig = buf.subarray(buf.length - 10)

      const expectedSig = crypto
        .createHmac("sha256", SECRET_KEY)
        .update(dataBuf)
        .digest()
        .subarray(0, 10)

      if (!crypto.timingSafeEqual(providedSig, expectedSig)) {
        return null
      }

      const idHex = dataBuf.subarray(0, 16).toString("hex")
      const medicoId = formatUuidFromHex(idHex)
      const timestampSec = dataBuf.readUInt32BE(16)
      const nameLen = dataBuf[20]
      const secretariaNome = dataBuf.subarray(21, 21 + nameLen).toString("utf8")

      const nowSec = Math.floor(Date.now() / 1000)
      if (nowSec - timestampSec > maxAgeSec) {
        return null
      }

      return {
        medicoId,
        secretariaNome: secretariaNome || undefined,
        criadoEm: timestampSec * 1000,
      }
    }

    // 2. Formato com ponto (ntm_xxx.yyy ou legado xxx.yyy)
    const cleanToken = token.startsWith("ntm_") ? token.slice(4) : token
    const [encoded, signature] = cleanToken.split(".")
    if (!encoded || !signature) return null

    const expectedSignature = crypto
      .createHmac("sha256", SECRET_KEY)
      .update(encoded)
      .digest("base64url")

    if (signature !== expectedSignature) return null

    const jsonStr = Buffer.from(encoded, "base64url").toString("utf8")
    const payload: ConnectionTokenPayload = JSON.parse(jsonStr)

    const maxAgeMs = maxAgeSec * 1000
    if (Date.now() - payload.criadoEm > maxAgeMs) {
      return null
    }

    return payload
  } catch {
    return null
  }
}
