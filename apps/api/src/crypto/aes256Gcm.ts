import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto"

const GCM_IV_BYTES = 12
const GCM_AUTH_TAG_BYTES = 16

/**
 * Encrypts `plaintext` with AES-256-GCM under a 32-byte `key`. The result is
 * the base64 of the IV, the auth tag and the ciphertext, in that order. It
 * decrypts only with the same `associatedData`, which it does not contain.
 */
export function encryptAes256Gcm(
  plaintext: string,
  key: Buffer,
  associatedData?: string,
): string {
  const iv = randomBytes(GCM_IV_BYTES)
  const cipher = createCipheriv("aes-256-gcm", key, iv)

  if (associatedData !== undefined) {
    cipher.setAAD(Buffer.from(associatedData, "utf8"))
  }

  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ])

  return Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString("base64")
}

/**
 * The plaintext of an {@link encryptAes256Gcm} payload, or `null` when the
 * payload was altered, or was encrypted under another key or with other
 * associated data.
 */
export function decryptAes256Gcm(
  payload: string,
  key: Buffer,
  associatedData?: string,
): string | null {
  try {
    const packed = Buffer.from(payload, "base64")
    const iv = packed.subarray(0, GCM_IV_BYTES)
    const authTag = packed.subarray(
      GCM_IV_BYTES,
      GCM_IV_BYTES + GCM_AUTH_TAG_BYTES,
    )
    const ciphertext = packed.subarray(GCM_IV_BYTES + GCM_AUTH_TAG_BYTES)

    const decipher = createDecipheriv("aes-256-gcm", key, iv)
    decipher.setAuthTag(authTag)

    if (associatedData !== undefined) {
      decipher.setAAD(Buffer.from(associatedData, "utf8"))
    }

    return Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]).toString("utf8")
  } catch {
    return null
  }
}
