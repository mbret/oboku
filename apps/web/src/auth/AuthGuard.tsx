import { memo, useEffect } from "react"
import { httpClientApi } from "../http/httpClientApi.web"
import { useSignOut } from "./useSignOut"
import { authStateSignal } from "./states.web"
import { type FetchConfig, HttpClientError } from "../http/httpClient.shared"
import { httpCouchClient } from "../http/httpClientCouch.web"

const injectToken = async (config: FetchConfig) => {
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

const refreshTokenAndRetry = async (
  config: FetchConfig,
  refreshToken: string,
) => {
  try {
    const response = await httpClientApi.refreshToken({
      refreshToken,
      useInterceptors: false,
    })

    authStateSignal.update((state) => {
      if (!state) return state

      return {
        ...state,
        accessToken: response.data.accessToken,
        refreshToken: response.data.refreshToken,
      }
    })
  } catch (e) {
    console.log("Unable to refresh token")
    console.error(e)

    throw e
  }

  return httpClientApi.fetch(config.input, config)
}

export const AuthGuard = memo(() => {
  const signOut = useSignOut()

  useEffect(() => {
    const deregisterTokenInjectorToApi =
      // biome-ignore lint/correctness/useHookAtTopLevel: Not a hook
      httpClientApi.useRequestInterceptor(injectToken)

    const deregisterTokenInjectorToCouch =
      // biome-ignore lint/correctness/useHookAtTopLevel: Not a hook
      httpCouchClient.useRequestInterceptor(injectToken)

    // biome-ignore lint/correctness/useHookAtTopLevel: Not a hook
    const deregisterAutoSignOut = httpClientApi.useResponseInterceptor(
      async (response) => response,
      async (error: HttpClientError) => {
        if (
          error instanceof HttpClientError &&
          error.response?.status === 401
        ) {
          const refreshToken = authStateSignal.value?.refreshToken

          if (refreshToken) {
            try {
              return refreshTokenAndRetry(error.response.config, refreshToken)
            } catch (_e) {
              throw error
            }
          } else {
            signOut()
          }
        }

        throw error
      },
    )

    // biome-ignore lint/correctness/useHookAtTopLevel: Not a hook
    const deregisterAutoSignOutCouch = httpCouchClient.useResponseInterceptor(
      async (response) => {
        if (response?.status === 401) {
          const refreshToken = authStateSignal.value?.refreshToken

          if (refreshToken) {
            try {
              return refreshTokenAndRetry(response.config, refreshToken)
            } catch (_e) {
              return response
            }
          } else {
            signOut()
          }
        }

        return response
      },
    )

    return () => {
      deregisterTokenInjectorToApi()
      deregisterAutoSignOut()
      deregisterAutoSignOutCouch()
      deregisterTokenInjectorToCouch()
    }
  }, [signOut])

  return null
})
