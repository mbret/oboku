import { memo, useEffect, useEffectEvent } from "react"
import { HttpClientError } from "../http/httpClient.shared"
import { httpClientApi } from "../http/httpClientApi.web"
import { httpCouchClient } from "../http/httpClientCouch.web"
import { useSignOut } from "./useSignOut"

export const AuthGuard = memo(function AuthGuard() {
  const signOut = useSignOut()
  const signOutEffect = useEffectEvent(signOut)

  useEffect(() => {
    // Registered after the refresh interceptors so sign-out only runs if a
    // 401 survives the refresh/retry attempt.
    // biome-ignore lint/correctness/useHookAtTopLevel: Not a hook
    const deregisterApiInterceptor = httpClientApi.useResponseInterceptor(
      async (response) => response,
      async (error: HttpClientError) => {
        if (
          error instanceof HttpClientError &&
          error.response?.status === 401
        ) {
          signOutEffect()
        }

        throw error
      },
    )

    // biome-ignore lint/correctness/useHookAtTopLevel: Not a hook
    const deregisterCouchInterceptor = httpCouchClient.useResponseInterceptor(
      async (response) => {
        if (response?.status === 401) {
          signOutEffect()
        }

        return response
      },
    )

    return () => {
      deregisterApiInterceptor()
      deregisterCouchInterceptor()
    }
  }, [])

  return null
})
