import { authStateSignal } from "../auth/states.web"
import type { FetchConfig } from "./httpClient.shared"

export const injectToken = async (config: FetchConfig) => {
  const authState = authStateSignal.getValue()

  if (authState?.accessToken) {
    return {
      ...config,
      headers: {
        ...config.headers,
        Authorization: `Bearer ${authState.accessToken}`,
      },
    }
  }

  return config
}
