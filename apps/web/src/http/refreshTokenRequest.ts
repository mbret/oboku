import type { RefreshTokenResponse } from "@oboku/shared"
import { signRefreshProof } from "../auth/proofKey"
import { withAuthCookiesLock } from "./authCookiesLock"
import type { HttpClient } from "./httpClient.shared"

/**
 * Ceiling on how long one refresh may hold the origin-wide cookies lock. The
 * fetch itself is aborted rather than merely un-awaited: releasing the lock
 * while the request is still in flight would let a late `Set-Cookie` land after
 * the next holder (a sign-in, or a service-worker refresh) already took the
 * lock — the exact interleaving the lock exists to prevent.
 */
const REFRESH_REQUEST_TIMEOUT_MS = 30_000

/**
 * Refreshes the session over the httpOnly refresh cookie, proving possession of
 * the session's bound key with a DPoP proof header. Shared by the window and
 * service worker clients so the request stays identical in both contexts; the
 * only per-context difference is where the API origin comes from.
 */
export const refreshTokenRequest = (
  client: Pick<HttpClient, "postOrThrow">,
  apiUrl: string | undefined,
) =>
  withAuthCookiesLock(async () => {
    const url = `${apiUrl}/auth/token?grant_type=refresh_token`
    const proof = await signRefreshProof(url)

    return client.postOrThrow<RefreshTokenResponse, never>(url, {
      headers: proof ? { DPoP: proof } : {},
      useInterceptors: false,
      signal: AbortSignal.timeout(REFRESH_REQUEST_TIMEOUT_MS),
    })
  })
