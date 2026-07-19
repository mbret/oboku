import { SignJWT } from "jose"
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

export type StoredProofKey = {
  privateKey: CryptoKey
  publicJwk: JsonWebKey & { kty: string }
}

export const createProofKey = async (): Promise<StoredProofKey> => {
  const keyPair = await crypto.subtle.generateKey(
    ECDSA_P256_KEY_PARAMS,
    false,
    ["sign"],
  )
  const publicJwk = await crypto.subtle.exportKey("jwk", keyPair.publicKey)
  const { kty } = publicJwk

  if (!kty) {
    throw new Error("Exported proof public JWK is missing kty")
  }

  return { privateKey: keyPair.privateKey, publicJwk: { ...publicJwk, kty } }
}

export const persistProofKey = (proofKey: StoredProofKey) =>
  dexieDb.keyValue.put({ key: CURRENT_PROOF_KEY, value: proofKey })

export const deleteProofKey = () => dexieDb.keyValue.delete(CURRENT_PROOF_KEY)

export const hasProofKey = async (): Promise<boolean> =>
  (await dexieDb.keyValue.get(CURRENT_PROOF_KEY)) !== undefined

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

  return new SignJWT({
    htm: "POST",
    htu: url,
    jti: crypto.randomUUID(),
  })
    .setProtectedHeader({
      alg: "ES256",
      typ: "dpop+jwt",
      jwk: stored.value.publicJwk,
    })
    .setIssuedAt()
    .sign(stored.value.privateKey)
}
