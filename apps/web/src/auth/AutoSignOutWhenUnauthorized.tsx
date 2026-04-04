import { memo, useLayoutEffect } from "react"
import { HttpClientError } from "../http/httpClient.shared"
import { httpClientApi } from "../http/httpClientApi.web"
import { httpCouchClient } from "../http/httpClientCouch.web"
import { useSignOut } from "./useSignOut"
import { useLiveRef } from "reactjrx"

/**
 * Keep this guard inside the plugin provider boundary.
 *
 * `useSignOut()` delegates to `usePluginsSignOut()`, so this component should
 * stay under any plugin `Provider`s. At the same time it still needs to attach
 * the final 401 -> sign-out fallback before boot-time passive effects start
 * network work. We therefore register the sign-out interceptors in a layout
 * effect so they are attached before parent `LoadConfiguration` passive
 * effects kick off startup requests.
 */
export const AutoSignOutWhenUnauthorized = memo(
  function AutoSignOutWhenUnauthorized() {
    const signOut = useSignOut()
    const signOutRef = useLiveRef(signOut)

    useLayoutEffect(() => {
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
            signOutRef.current()
          }

          throw error
        },
      )

      // biome-ignore lint/correctness/useHookAtTopLevel: Not a hook
      const deregisterCouchInterceptor = httpCouchClient.useResponseInterceptor(
        async (response) => {
          if (response?.status === 401) {
            signOutRef.current()
          }

          return response
        },
      )

      return () => {
        deregisterApiInterceptor()
        deregisterCouchInterceptor()
      }
    }, [signOutRef])

    return null
  },
)
