import type { QueryClient } from "@tanstack/react-query"
import { authQueryKey, getAuthSession } from "../auth/authSession"
import type { AuthSession } from "../auth/types"
import { Logger } from "../debug/logger.shared"
import { getActiveProfileId } from "../profiles/activeProfile"
import { putProfileRow } from "../profiles/profilesDb"
import {
  type FetchConfig,
  HttpClientError,
  type HttpClientResponse,
} from "./httpClient.shared"
import { httpClientApi } from "./httpClientApi.web"

type InFlightRefresh = {
  refreshToken: string
  promise: Promise<boolean>
}

export type ApiAuthInterceptors = {
  injectToken: (config: FetchConfig) => Promise<FetchConfig>
  refreshOnUnauthorized: (
    response: HttpClientResponse,
  ) => Promise<HttpClientResponse>
  refreshAuthSession: (refreshToken: string) => Promise<boolean>
  getAuthSession: () => AuthSession | null
}

/**
 * Builds the auth-aware HTTP interceptors and the service-worker auth bridge
 * around a single `queryClient`. The in-flight refresh dedup lives in this
 * closure so the response interceptor and the service worker share one refresh.
 *
 * Auth reads/writes go through the react-query cache (the in-memory source of
 * truth); persistence to the `profiles` Dexie table is best-effort, mirroring
 * the previous throttled-signal persistence.
 */
export const createApiAuthInterceptors = (
  queryClient: QueryClient,
): ApiAuthInterceptors => {
  let refreshSessionPromise: InFlightRefresh | null = null

  const readAuthSession = () =>
    getAuthSession(queryClient, getActiveProfileId(queryClient))

  const commitAuthSession = (auth: AuthSession) => {
    queryClient.setQueryData(authQueryKey(auth.nameHex), auth)

    void Promise.resolve()
      .then(() => putProfileRow({ id: auth.nameHex, auth }))
      .catch((error) => {
        Logger.error("Failed to persist auth session", error)
      })
  }

  const injectToken = async (config: FetchConfig) => {
    const accessToken = readAuthSession()?.accessToken

    if (accessToken) {
      return {
        ...config,
        headers: {
          ...config.headers,
          Authorization: `Bearer ${accessToken}`,
        },
      }
    }

    return config
  }

  const refreshAuthState = async (refreshToken: string) => {
    const response = await httpClientApi.refreshToken({
      refreshToken,
      useInterceptors: false,
    })

    const authState = readAuthSession()

    // Only apply the refreshed tokens when they still belong to the active
    // session; otherwise a switch happened while the refresh was in flight.
    if (!authState || authState.refreshToken !== refreshToken) {
      return false
    }

    commitAuthSession({
      ...authState,
      accessToken: response.data.accessToken,
      refreshToken: response.data.refreshToken,
      needsRelogin: false,
    })

    return true
  }

  const refreshAuthSession = (refreshToken: string) => {
    if (refreshSessionPromise?.refreshToken === refreshToken) {
      return refreshSessionPromise.promise
    }

    const promise = refreshAuthState(refreshToken).finally(() => {
      if (refreshSessionPromise?.promise === promise) {
        refreshSessionPromise = null
      }
    })

    refreshSessionPromise = {
      refreshToken,
      promise,
    }

    return promise
  }

  const refreshTokenWasRejected = (error: unknown) =>
    error instanceof HttpClientError &&
    (error.response?.status === 401 || error.response?.status === 403)

  const flagSessionForRelogin = (rejectedRefreshToken: string) => {
    const authState = readAuthSession()

    if (
      authState?.refreshToken === rejectedRefreshToken &&
      !authState.needsRelogin
    ) {
      commitAuthSession({ ...authState, needsRelogin: true })
    }
  }

  const refreshOnUnauthorized = async (response: HttpClientResponse) => {
    if (response.status !== 401) {
      return response
    }

    const refreshToken = readAuthSession()?.refreshToken

    if (!refreshToken) {
      return response
    }

    try {
      const didApply = await refreshAuthSession(refreshToken)

      if (!didApply) {
        return response
      }
    } catch (error) {
      Logger.error("Unable to refresh token", error)

      const sessionIsTrulyExpired = refreshTokenWasRejected(error)

      if (!sessionIsTrulyExpired) {
        return response
      }

      flagSessionForRelogin(refreshToken)

      return response
    }

    // Retry once with the refreshed token, but skip interceptors on the retry so
    // a persistent 401 can fall through to the later sign-out interceptor.
    const retriedConfig = await injectToken({
      ...response.config,
      useInterceptors: false,
    })

    return httpClientApi.fetch(retriedConfig.input, retriedConfig)
  }

  return {
    injectToken,
    refreshOnUnauthorized,
    refreshAuthSession,
    getAuthSession: readAuthSession,
  }
}
