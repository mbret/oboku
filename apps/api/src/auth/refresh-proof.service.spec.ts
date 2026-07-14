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
  jti = "jti-1",
  issuedAt,
}: {
  privateKey: KeyLike
  headerJwk: JWK
  htm?: string
  jti?: string | null
  issuedAt?: number
}) => {
  const jwt = new SignJWT({
    htm,
    htu: "https://api/auth/token",
    ...(jti === null ? {} : { jti }),
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

  it("rejects a proof without a jti", async () => {
    const proof = await signProof({
      privateKey: boundKeys.privateKey,
      headerJwk: boundKeys.publicJwk,
      jti: null,
    })

    await expect(
      service.isProofValid({
        proof,
        boundPublicKey: JSON.stringify(boundKeys.publicJwk),
      }),
    ).resolves.toBe(false)
  })

  it("rejects the same proof presented twice (captured pair replay)", async () => {
    const proof = await signProof({
      privateKey: boundKeys.privateKey,
      headerJwk: boundKeys.publicJwk,
    })
    const boundPublicKey = JSON.stringify(boundKeys.publicJwk)

    await expect(service.isProofValid({ proof, boundPublicKey })).resolves.toBe(
      true,
    )
    await expect(service.isProofValid({ proof, boundPublicKey })).resolves.toBe(
      false,
    )
  })

  it("remembers a jti until the proof stops verifying, even with a fast client clock", async () => {
    jest.useFakeTimers()

    try {
      const clockToleranceSeconds = 5 * 60
      const firstUseSeconds = 1_700_000_000
      jest.setSystemTime(firstUseSeconds * 1000)

      const boundPublicKey = JSON.stringify(boundKeys.publicJwk)
      const fastClientIat = firstUseSeconds + clockToleranceSeconds
      const proof = await signProof({
        privateKey: boundKeys.privateKey,
        headerJwk: boundKeys.publicJwk,
        issuedAt: fastClientIat,
      })

      await expect(
        service.isProofValid({ proof, boundPublicKey }),
      ).resolves.toBe(true)

      jest.setSystemTime((firstUseSeconds + 700) * 1000)

      await expect(
        service.isProofValid({ proof, boundPublicKey }),
      ).resolves.toBe(false)
    } finally {
      jest.useRealTimers()
    }
  })

  it("accepts successive proofs with distinct jtis from the same key", async () => {
    const boundPublicKey = JSON.stringify(boundKeys.publicJwk)
    const firstProof = await signProof({
      privateKey: boundKeys.privateKey,
      headerJwk: boundKeys.publicJwk,
      jti: "jti-first",
    })
    const secondProof = await signProof({
      privateKey: boundKeys.privateKey,
      headerJwk: boundKeys.publicJwk,
      jti: "jti-second",
    })

    await expect(
      service.isProofValid({ proof: firstProof, boundPublicKey }),
    ).resolves.toBe(true)
    await expect(
      service.isProofValid({ proof: secondProof, boundPublicKey }),
    ).resolves.toBe(true)
  })

  it("scopes jti replay tracking per bound key", async () => {
    const otherSession = await generateKeyPair("ES256")
    const otherJwk = await exportJWK(otherSession.publicKey)
    const sharedJti = "jti-shared"
    const proofForBoundKey = await signProof({
      privateKey: boundKeys.privateKey,
      headerJwk: boundKeys.publicJwk,
      jti: sharedJti,
    })
    const proofForOtherKey = await signProof({
      privateKey: otherSession.privateKey,
      headerJwk: otherJwk,
      jti: sharedJti,
    })

    await expect(
      service.isProofValid({
        proof: proofForBoundKey,
        boundPublicKey: JSON.stringify(boundKeys.publicJwk),
      }),
    ).resolves.toBe(true)
    await expect(
      service.isProofValid({
        proof: proofForOtherKey,
        boundPublicKey: JSON.stringify(otherJwk),
      }),
    ).resolves.toBe(true)
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
