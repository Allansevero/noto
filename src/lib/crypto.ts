/**
 * ====================================================================
 * Módulo de Criptografia & Segurança de Dados Sensíveis
 * Padrão: AES-GCM (256-bit) via Web Crypto API nativa do navegador
 * ====================================================================
 */

// Chave base derivada da assinatura do ambiente para garantir sigilo
const APP_SECRET =
  (typeof window !== "undefined" && (import.meta as any).env?.VITE_SUPABASE_ANON_KEY) ||
  "noto-secure-secret-encryption-key-2026";

/**
 * Deriva uma CryptoKey a partir de uma senha/segredo usando PBKDF2
 */
async function getCryptoKey(salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(APP_SECRET),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as any,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Criptografa um texto sensível (ex: senha de prefeitura, certificado, token)
 * Retorna uma string segura contendo Salt + IV + Ciphertext em Base64
 */
export async function encryptSensitiveData(plainText: string): Promise<string> {
  if (!plainText) return "";

  try {
    const enc = new TextEncoder();
    const data = enc.encode(plainText);

    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const key = await getCryptoKey(salt);

    const encrypted = await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      key,
      data
    );

    // Concatena Salt (16) + IV (12) + Encrypted Data
    const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(new Uint8Array(encrypted), salt.length + iv.length);

    // Converte para Base64
    let binary = "";
    for (let i = 0; i < combined.byteLength; i++) {
      binary += String.fromCharCode(combined[i]);
    }
    return btoa(binary);
  } catch (err) {
    console.error("Erro ao criptografar dado sensível:", err);
    throw new Error("Falha na criptografia de segurança.");
  }
}

/**
 * Descriptografa um dado seguro em Base64 para o texto original
 */
export async function decryptSensitiveData(cipherTextBase64: string): Promise<string> {
  if (!cipherTextBase64) return "";

  try {
    const binary = atob(cipherTextBase64);
    const combined = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      combined[i] = binary.charCodeAt(i);
    }

    const salt = combined.slice(0, 16);
    const iv = combined.slice(16, 28);
    const encryptedData = combined.slice(28);

    const key = await getCryptoKey(salt);

    const decrypted = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      key,
      encryptedData
    );

    const dec = new TextDecoder();
    return dec.decode(decrypted);
  } catch (err) {
    console.error("Erro ao descriptografar dado sensível:", err);
    return "";
  }
}

/**
 * Mascara strings sensíveis para exibição segura (ex: tokens, CPFs, senhas)
 */
export function maskSecret(value: string, visibleChars = 4): string {
  if (!value) return "";
  if (value.length <= visibleChars) return "••••••••";
  return `${value.slice(0, 2)}••••••••${value.slice(-visibleChars)}`;
}
