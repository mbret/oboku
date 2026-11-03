import { createHash, timingSafeEqual } from "node:crypto"

/**
 * An unsalted SHA-256, safe only for random secrets too long to guess, such
 * as generated passwords and keys. A password a person chose needs bcrypt.
 */
export const hashSecret = (secret: string) =>
  createHash("sha256").update(secret).digest("hex")

export const isSecretMatchingHash = (secret: string, secretHash: string) =>
  timingSafeEqual(
    Buffer.from(hashSecret(secret), "hex"),
    Buffer.from(secretHash, "hex"),
  )
