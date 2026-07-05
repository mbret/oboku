import { dexieDb } from "../rxdb/dexie"

/**
 * Sender-constrained refresh key management. The private key is generated
 * non-extractable, so even code running inside the app (XSS) can only ask the
 * browser to sign with it — never read it. Deleting it is therefore a
 * fail-closed logout: without the key no one can refresh this session again.
 * Every session is bound to a key — a browser that cannot create or store one
 * (no WebCrypto, evicted IndexedDB) cannot sign in.
 *
 * A key is generated in memory and only persisted as `current` once the server
 * has bound it. Each sign-in attempt carries its own key from creation through
 * to persistence, so a failed attempt never clobbers the active session's key
 * and overlapping attempts can never promote a key the server did not bind.
 */

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

export const createProofKey = async (): Promise<StoredProofKey> => {
  const keyPair = await crypto.subtle.generateKey(
    ECDSA_P256_KEY_PARAMS,
    false,
    ["sign"],
  )
  const publicJwk = await crypto.subtle.exportKey("jwk", keyPair.publicKey)

  return { privateKey: keyPair.privateKey, publicJwk }
}

export const persistProofKey = (proofKey: StoredProofKey) =>
  dexieDb.keyValue.put({ key: CURRENT_PROOF_KEY, value: proofKey })

export const deleteProofKey = () => dexieDb.keyValue.delete(CURRENT_PROOF_KEY)

/**
 * Builds the DPoP-style proof JWT (RFC 9449 shape) sent with `/auth/token`.
 * Returns undefined when no key is registered (deleted or evicted storage) —
 * the server then rejects the refresh and the user must sign in again.
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
