import { Logger } from "@nestjs/common"
import {
  exportJWK,
  generateKeyPair,
  SignJWT,
  type JWK,
  type KeyLike,
} from "jose"
import { RefreshProofService } from "./refresh-proof.service"

const signProof = async ({
  privateKey,
  headerJwk,
  htm = "POST",
  issuedAt,
}: {
  privateKey: KeyLike
  headerJwk: JWK
  htm?: string
  issuedAt?: number
}) => {
  const jwt = new SignJWT({
    htm,
    htu: "https://api/auth/token",
    jti: "jti-1",
  }).setProtectedHeader({ alg: "ES256", typ: "dpop+jwt", jwk: headerJwk })

  if (issuedAt !== undefined) {
    jwt.setIssuedAt(issuedAt)
  } else {
    jwt.setIssuedAt()
  }

  return jwt.sign(privateKey)
}

describe("RefreshProofService", () => {
  let service: RefreshProofService
  let boundKeys: { privateKey: KeyLike; publicJwk: JWK }

  beforeAll(async () => {
    const { privateKey, publicKey } = await generateKeyPair("ES256")

    boundKeys = { privateKey, publicJwk: await exportJWK(publicKey) }
  })

  beforeEach(() => {
    jest.spyOn(Logger.prototype, "warn").mockImplementation(() => undefined)

    service = new RefreshProofService()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it("accepts a fresh proof signed by the bound key", async () => {
    const proof = await signProof({
      privateKey: boundKeys.privateKey,
      headerJwk: boundKeys.publicJwk,
    })

    await expect(
      service.isProofValid({
        proof,
        boundPublicKey: JSON.stringify(boundKeys.publicJwk),
      }),
    ).resolves.toBe(true)
  })

  it("rejects a proof signed by a different key (stolen cookie, no key)", async () => {
    const attacker = await generateKeyPair("ES256")
    const attackerJwk = await exportJWK(attacker.publicKey)
    const proof = await signProof({
      privateKey: attacker.privateKey,
      headerJwk: attackerJwk,
    })

    await expect(
      service.isProofValid({
        proof,
        boundPublicKey: JSON.stringify(boundKeys.publicJwk),
      }),
    ).resolves.toBe(false)
  })

  it("rejects a proof whose embedded key does not match its signature", async () => {
    const attacker = await generateKeyPair("ES256")
    const proof = await signProof({
      privateKey: attacker.privateKey,
      // embeds the victim's key to pass the thumbprint check
      headerJwk: boundKeys.publicJwk,
    })

    await expect(
      service.isProofValid({
        proof,
        boundPublicKey: JSON.stringify(boundKeys.publicJwk),
      }),
    ).resolves.toBe(false)
  })

  it("rejects a tampered proof", async () => {
    const proof = await signProof({
      privateKey: boundKeys.privateKey,
      headerJwk: boundKeys.publicJwk,
    })
    const [header, , signature] = proof.split(".")
    const forgedPayload = Buffer.from(
      JSON.stringify({
        htm: "POST",
        htu: "https://api/auth/token",
        jti: "jti-2",
        iat: Math.floor(Date.now() / 1000),
      }),
    ).toString("base64url")

    await expect(
      service.isProofValid({
        proof: `${header}.${forgedPayload}.${signature}`,
        boundPublicKey: JSON.stringify(boundKeys.publicJwk),
      }),
    ).resolves.toBe(false)
  })

  it("rejects a replayed proof outside the freshness window", async () => {
    const oneHourAgo = Math.floor(Date.now() / 1000) - 60 * 60
    const proof = await signProof({
      privateKey: boundKeys.privateKey,
      headerJwk: boundKeys.publicJwk,
      issuedAt: oneHourAgo,
    })

    await expect(
      service.isProofValid({
        proof,
        boundPublicKey: JSON.stringify(boundKeys.publicJwk),
      }),
    ).resolves.toBe(false)
  })

  it("rejects a proof for another HTTP method", async () => {
    const proof = await signProof({
      privateKey: boundKeys.privateKey,
      headerJwk: boundKeys.publicJwk,
      htm: "GET",
    })

    await expect(
      service.isProofValid({
        proof,
        boundPublicKey: JSON.stringify(boundKeys.publicJwk),
      }),
    ).resolves.toBe(false)
  })

  it("rejects when the stored key is not valid JSON", async () => {
    const proof = await signProof({
      privateKey: boundKeys.privateKey,
      headerJwk: boundKeys.publicJwk,
    })

    await expect(
      service.isProofValid({ proof, boundPublicKey: "not-json" }),
    ).resolves.toBe(false)
  })
})
