import { EmbeddedJWK, jwtVerify } from "jose"
import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  createProofKey,
  hasProofKey,
  persistProofKey,
  signRefreshProof,
} from "./proofKey"

const keyValueStore = vi.hoisted(
  () => new Map<string, { key: string; value: unknown }>(),
)

vi.mock("../rxdb/dexie", () => ({
  dexieDb: {
    keyValue: {
      get: async (key: string) => keyValueStore.get(key),
      put: async (entry: { key: string; value: unknown }) => {
        keyValueStore.set(entry.key, entry)
      },
      delete: async (key: string) => {
        keyValueStore.delete(key)
      },
    },
  },
}))

/** Mirrors the verification in the API's RefreshProofService. */
const verifyLikeTheServer = (proof: string) =>
  jwtVerify(proof, EmbeddedJWK, {
    algorithms: ["ES256"],
    typ: "dpop+jwt",
    maxTokenAge: 5 * 60,
    clockTolerance: 5 * 60,
  })

describe("signRefreshProof", () => {
  beforeEach(() => {
    keyValueStore.clear()
  })

  it("returns undefined when no proof key is persisted", async () => {
    await expect(
      signRefreshProof("https://api.example.com/auth/token"),
    ).resolves.toBeUndefined()
  })

  it("produces a proof that passes the server-side verification", async () => {
    const proofKey = await createProofKey()
    await persistProofKey(proofKey)

    const url = "https://api.example.com/auth/token?grant_type=refresh_token"
    const proof = await signRefreshProof(url)

    if (!proof) throw new Error("expected a proof to be signed")

    const { payload, protectedHeader } = await verifyLikeTheServer(proof)

    expect(protectedHeader.jwk).toEqual(proofKey.publicJwk)
    expect(payload.htm).toBe("POST")
    expect(payload.htu).toBe(url)
    expect(typeof payload.jti).toBe("string")
    expect(payload.jti).not.toHaveLength(0)
  })

  it("signs a unique jti per proof", async () => {
    await persistProofKey(await createProofKey())

    const url = "https://api.example.com/auth/token"
    const [first, second] = await Promise.all([
      signRefreshProof(url),
      signRefreshProof(url),
    ])

    if (!first || !second) throw new Error("expected proofs to be signed")

    const [firstVerified, secondVerified] = await Promise.all([
      verifyLikeTheServer(first),
      verifyLikeTheServer(second),
    ])

    expect(firstVerified.payload.jti).not.toBe(secondVerified.payload.jti)
  })
})

describe("hasProofKey", () => {
  beforeEach(() => {
    keyValueStore.clear()
  })

  it("is false when no proof key is persisted", async () => {
    await expect(hasProofKey()).resolves.toBe(false)
  })

  it("is true once a proof key is persisted", async () => {
    await persistProofKey(await createProofKey())

    await expect(hasProofKey()).resolves.toBe(true)
  })
})
