import { Injectable, Logger } from "@nestjs/common"
import { calculateJwkThumbprint, EmbeddedJWK, jwtVerify, type JWK } from "jose"

/**
 * Tolerated `iat` age / clock skew for a proof. Generous compared to RFC 9449
 * examples because it only bounds replay of a capture that already implies a
 * compromised client, while too-tight a window logs out users with skewed
 * clocks.
 */
const PROOF_FRESHNESS_WINDOW_SECONDS = 5 * 60

@Injectable()
export class RefreshProofService {
  private readonly logger = new Logger(RefreshProofService.name)

  /**
   * Verifies a DPoP-style proof JWT against the public key bound to the
   * refresh session: signature by the JWK embedded in the proof header, that
   * JWK matching the bound key (thumbprint), `htm` = POST and a fresh `iat`.
   * `htu` is deliberately not enforced — reverse proxies (`changeOrigin`)
   * make the server-side reconstructed URL unreliable; signature + thumbprint
   * + freshness are the effective checks.
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

      const boundJwk: JWK = JSON.parse(boundPublicKey)
      const [proofThumbprint, boundThumbprint] = await Promise.all([
        calculateJwkThumbprint(protectedHeader.jwk),
        calculateJwkThumbprint(boundJwk),
      ])

      return proofThumbprint === boundThumbprint && payload.htm === "POST"
    } catch (error) {
      this.logger.warn(`Rejected refresh proof: ${error}`)

      return false
    }
  }
}
