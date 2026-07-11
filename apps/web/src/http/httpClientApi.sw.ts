import { serviceWorkerConfiguration } from "../config/configuration.sw"
import { RefreshingHttpClient } from "./httpClient.shared"
import { refreshTokenRequest } from "./refreshTokenRequest"

/**
 * Auth rides on the httpOnly access cookie, which the browser attaches for the
 * service worker like for any client. On a 401 the worker refreshes inline —
 * the refresh cookie plus a DPoP proof signed with the session's bound key
 * (read from the same IndexedDB the window uses) — and replays the request, so
 * a covers fetch only surfaces a 401 when the session is genuinely expired.
 *
 * Unlike the window client this keeps no session bookkeeping: a failed refresh
 * just returns the 401. The main thread owns flagging the session for relogin
 * on its own traffic.
 */
class HttpApiClientSw extends RefreshingHttpClient {
  constructor() {
    super({ credentials: "include" })
  }

  protected applyRefresh = async () => {
    await refreshTokenRequest(this, serviceWorkerConfiguration.API_URL)

    this.markRefreshApplied()

    return true
  }
}

export const httpClientApi = new HttpApiClientSw()
