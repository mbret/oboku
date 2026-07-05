import { dexieDb } from "../rxdb/dexie"
import { Logger } from "../debug/logger.shared"

/**
 * Sender-constrained refresh key management. The private key is generated
 * non-extractable, so even code running inside the app (XSS) can only ask the
 * browser to sign with it — never read it. Deleting it is therefore a
 * fail-closed logout: without the key no one can refresh this session again.
 *
 * Keys are staged under a `pending` slot while a sign-in is in flight and
 * promoted to `current` only once the server has bound them, so a failed
 * sign-in attempt never clobbers the key of the session that is still active.
 */

const PENDING_PROOF_KEY = "auth.proofKey.pending"
const CURRENT_PROOF_KEY = "auth.proofKey.current"

const ECDSA_P256_KEY_PARAMS = { name: "ECDSA", namedCurve: "P-256" }
const ES256_SIGN_PARAMS = { name: "ECDSA", hash: "SHA-256" }

export type StoredProofKey = {
  privateKey: CryptoKey
  publicJwk: JsonWebKey
}

const base64UrlEncode = (bytes: Uint8Array) => {
  let binary = ""

  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

const encodeJsonProofPart = (part: object) =>
  base64UrlEncode(new TextEncoder().encode(JSON.stringify(part)))

export const createPendingProofKey = async (): Promise<JsonWebKey> => {
  const keyPair = await crypto.subtle.generateKey(
    ECDSA_P256_KEY_PARAMS,
    false,
    ["sign"],
  )
  const publicJwk = await crypto.subtle.exportKey("jwk", keyPair.publicKey)

  await dexieDb.keyValue.put({
    key: PENDING_PROOF_KEY,
    value: { privateKey: keyPair.privateKey, publicJwk },
  })

  return publicJwk
}

/**
 * Undefined when key storage or WebCrypto is unavailable (private browsing,
 * evicted IndexedDB): the sign-in then proceeds unbound rather than failing
 * outright, and the session simply refreshes without sender constraining.
 */
export const createPendingProofKeyIfPossible = async (): Promise<
  JsonWebKey | undefined
> => {
  try {
    return await createPendingProofKey()
  } catch (error) {
    Logger.error("Failed to create a refresh proof key", error)

    return undefined
  }
}

export const promotePendingProofKey = async () => {
  await dexieDb.transaction("rw", dexieDb.keyValue, async () => {
    const pending = await dexieDb.keyValue.get(PENDING_PROOF_KEY)

    if (!pending) return

    await dexieDb.keyValue.put({ key: CURRENT_PROOF_KEY, value: pending.value })
    await dexieDb.keyValue.delete(PENDING_PROOF_KEY)
  })
}

export const deleteProofKeys = () =>
  dexieDb.keyValue.bulkDelete([PENDING_PROOF_KEY, CURRENT_PROOF_KEY])

/**
 * Builds the DPoP-style proof JWT (RFC 9449 shape) sent with `/auth/token`.
 * Returns undefined when no key is registered (pre-binding session or evicted
 * storage) — the refresh then only succeeds for a not-yet-bound session.
 */
export const signRefreshProof = async (
  url: string,
): Promise<string | undefined> => {
  const stored = await dexieDb.keyValue.get(CURRENT_PROOF_KEY)

  if (!stored) return undefined

  const header = { alg: "ES256", typ: "dpop+jwt", jwk: stored.value.publicJwk }
  const payload = {
    htm: "POST",
    htu: url,
    iat: Math.floor(Date.now() / 1000),
    jti: crypto.randomUUID(),
  }
  const signingInput = `${encodeJsonProofPart(header)}.${encodeJsonProofPart(payload)}`
  const signature = await crypto.subtle.sign(
    ES256_SIGN_PARAMS,
    stored.value.privateKey,
    new TextEncoder().encode(signingInput),
  )

  return `${signingInput}.${base64UrlEncode(new Uint8Array(signature))}`
}
