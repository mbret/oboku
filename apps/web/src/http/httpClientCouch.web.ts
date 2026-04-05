import { authStateSignal } from "../auth/states.web"
import { refreshTokenAndRetry } from "./httpClientApi.web"
import { HttpClient } from "./httpClient.shared"
import { injectToken } from "./injectToken.web"

class HttpCouchClient extends HttpClient {}

export const httpCouchClient = new HttpCouchClient()

// biome-ignore lint/correctness/useHookAtTopLevel: Not a hook
httpCouchClient.useRequestInterceptor(injectToken)

// biome-ignore lint/correctness/useHookAtTopLevel: Not a hook
httpCouchClient.useResponseInterceptor(async (response) => {
  if (response?.status === 401) {
    const refreshToken = authStateSignal.value?.refreshToken

    if (refreshToken) {
      try {
        return refreshTokenAndRetry(response.config, refreshToken)
      } catch (_e) {
        return response
      }
    }
  }

  return response
})
