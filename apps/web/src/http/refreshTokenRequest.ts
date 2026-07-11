import type { RefreshTokenResponse } from "@oboku/shared"
import { signRefreshProof } from "../auth/proofKey"
import { withAuthCookiesLock } from "./authCookiesLock"
import type { HttpClient } from "./httpClient.shared"

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
    })
  })
