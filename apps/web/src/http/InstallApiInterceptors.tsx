import { memo, type ReactNode, useEffect, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { setUser } from "@sentry/react"
import { useAuthSession } from "../auth/authSession"
import { setSwAuthResponder } from "../workers/communication/authResponder.web"
import { createApiAuthInterceptors } from "./apiAuthInterceptors.web"
import { httpClientApi } from "./httpClientApi.web"

/**
 * Installs the auth-aware HTTP interceptors and the service-worker auth bridge
 * from within React, closing over the `queryClient`, and tears them down on
 * cleanup. Children (which may issue authenticated requests) are gated until
 * installation completes so no request fires before a token can be injected.
 */
export const InstallApiInterceptors = memo(function InstallApiInterceptors({
  children,
}: {
  children: ReactNode
}) {
  const queryClient = useQueryClient()
  const [isInstalled, setIsInstalled] = useState(false)
  const { data: auth } = useAuthSession()

  useEffect(
    function installApiInterceptors() {
      const interceptors = createApiAuthInterceptors(queryClient)
      // biome-ignore lint/correctness/useHookAtTopLevel: Not a hook
      const disposeRequestInterceptor = httpClientApi.useRequestInterceptor(
        interceptors.injectToken,
      )
      // biome-ignore lint/correctness/useHookAtTopLevel: Not a hook
      const disposeResponseInterceptor = httpClientApi.useResponseInterceptor(
        interceptors.refreshOnUnauthorized,
      )

      setSwAuthResponder({
        getAuthSession: interceptors.getAuthSession,
        refreshAuthSession: interceptors.refreshAuthSession,
      })
      setIsInstalled(true)

      return function uninstallApiInterceptors() {
        disposeRequestInterceptor()
        disposeResponseInterceptor()
        setSwAuthResponder(null)
        setIsInstalled(false)
      }
    },
    [queryClient],
  )

  useEffect(
    function syncSentryUser() {
      if (auth) {
        setUser({ email: auth.email, id: auth.nameHex, username: auth.dbName })
      } else {
        setUser(null)
      }
    },
    [auth],
  )

  if (!isInstalled) return null

  return <>{children}</>
})
