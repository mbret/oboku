import { HttpClient } from "./httpClient.shared"
import { authState } from "../auth/states.sw"

export const httpClientApi = new HttpClient()

// biome-ignore lint/correctness/useHookAtTopLevel: Not a hook
httpClientApi.useRequestInterceptor(async (config) => {
  const auth = authState.value

  if (auth?.accessToken) {
    return {
      ...config,
      headers: {
        ...config.headers,
        Authorization: `Bearer ${auth.accessToken}`,
      },
    }
  }

  return config
})
