import { refreshOnUnauthorized } from "./httpClientApi.web"
import { HttpClient } from "./httpClient.shared"
import { injectToken } from "./injectToken.web"

class HttpCouchClient extends HttpClient {}

export const httpCouchClient = new HttpCouchClient()

// biome-ignore lint/correctness/useHookAtTopLevel: Not a hook
httpCouchClient.useRequestInterceptor(injectToken)

// biome-ignore lint/correctness/useHookAtTopLevel: Not a hook
httpCouchClient.useResponseInterceptor(refreshOnUnauthorized)
