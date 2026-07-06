import { Injectable, Logger } from "@nestjs/common"
import { calculateJwkThumbprint, EmbeddedJWK, jwtVerify, type JWK } from "jose"

/**
 * Tolerated `iat` age / clock skew for a proof. Generous compared to RFC 9449
 * examples because it only bounds replay of a capture that already implies a
 * compromised client, while too-tight a window logs out users with skewed
 * clocks.
 */
const PROOF_FRESHNESS_WINDOW_SECONDS = 5 * 60

/**
 * jose accepts an `iat` up to `maxTokenAge + clockTolerance` old, so a jti
 * must be remembered for the sum of both windows to cover every proof still
 * accepted as fresh.
 */
const SEEN_JTI_TTL_MS = 2 * PROOF_FRESHNESS_WINDOW_SECONDS * 1000

@Injectable()
export class RefreshProofService {
  private readonly logger = new Logger(RefreshProofService.name)
  private readonly seenJtiExpiries = new Map<string, number>()

  /**
   * Verifies a DPoP-style proof JWT against the public key bound to the
   * refresh session: signature by the JWK embedded in the proof header, that
   * JWK matching the bound key (thumbprint), `htm` = POST, a fresh `iat` and
   * a single-use `jti` (RFC 9449 §11.1) so a captured proof cannot be
   * replayed within the freshness window. `htu` is deliberately not
   * enforced — reverse proxies (`changeOrigin`) make the server-side
   * reconstructed URL unreliable; signature + thumbprint + freshness are the
   * effective checks.
   */
  async isProofValid({
    proof,
    boundPublicKey,
  }: {
    proof: string
    boundPublicKey: string
  }): Promise<boolean> {
    try {
      const { payload, protectedHeader } = await jwtVerify(proof, EmbeddedJWK, {
        algorithms: ["ES256"],
        typ: "dpop+jwt",
        maxTokenAge: PROOF_FRESHNESS_WINDOW_SECONDS,
        clockTolerance: PROOF_FRESHNESS_WINDOW_SECONDS,
      })

      if (!protectedHeader.jwk) {
        return false
      }

      if (typeof payload.jti !== "string" || payload.jti.length === 0) {
        return false
      }

      const boundJwk: JWK = JSON.parse(boundPublicKey)
      const [proofThumbprint, boundThumbprint] = await Promise.all([
        calculateJwkThumbprint(protectedHeader.jwk),
        calculateJwkThumbprint(boundJwk),
      ])

      if (proofThumbprint !== boundThumbprint || payload.htm !== "POST") {
        return false
      }

      return this.tryConsumeJti(`${boundThumbprint}:${payload.jti}`)
    } catch (error) {
      this.logger.warn(`Rejected refresh proof: ${error}`)

      return false
    }
  }

  /**
   * In-memory on purpose: the API is a single process (see
   * `RefreshTokensService.successorKey`), and losing the cache on restart
   * fails open — it can never falsely reject a legitimate client, which
   * signs a fresh jti per attempt.
   */
  private tryConsumeJti(jtiKey: string): boolean {
    const now = Date.now()

    for (const [seenKey, expiresAt] of this.seenJtiExpiries) {
      if (expiresAt <= now) {
        this.seenJtiExpiries.delete(seenKey)
      }
    }

    if (this.seenJtiExpiries.has(jtiKey)) {
      this.logger.warn("Rejected refresh proof: replayed jti")

      return false
    }

    this.seenJtiExpiries.set(jtiKey, now + SEEN_JTI_TTL_MS)

    return true
  }
}
