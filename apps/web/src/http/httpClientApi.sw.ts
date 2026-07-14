import { API_URL } from "../config/envs.shared"
import { hasProofKey } from "../auth/proofKey"
import { RefreshingHttpClient } from "./httpClient.shared"
import { refreshTokenRequest } from "./refreshTokenRequest"

/**
 * Auth rides on the httpOnly access cookie, which the browser attaches for the
 * service worker like for any client. On a 401 the worker refreshes inline —
 * the refresh cookie plus a DPoP proof signed with the session's bound key
 * (read from the same IndexedDB the window uses) — and replays the request, so
 * a covers fetch only surfaces a 401 when the session is genuinely expired.
 *
 * The worker keeps no session bookkeeping, so it gates the refresh on that
 * bound key rather than a session record: with no key persisted (logged out, or
 * evicted storage) a refresh could only fail its DPoP check, so the 401 passes
 * straight through instead of firing a doomed `/auth/token` request per 401.
 * Unlike the window client a failed refresh just returns the 401; the main
 * thread owns flagging the session for relogin on its own traffic.
 */
class HttpApiClientSw extends RefreshingHttpClient {
  constructor() {
    super({ credentials: "include" })
  }

  protected shouldAttemptRefresh = () => hasProofKey()

  protected applyRefresh = async () => {
    await refreshTokenRequest(this, API_URL)

    this.markRefreshApplied()

    return true
  }
}

export const httpClientApi = new HttpApiClientSw()
