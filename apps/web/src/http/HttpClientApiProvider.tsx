import { memo, type ReactNode, useEffect, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { HttpApiClientWeb } from "./HttpClientApi.web"
import { HttpClientApiContext } from "./HttpClientApiContext"
import { authQueryKey, useAuthSession } from "../auth/authSession"
import { putProfileRow } from "../profiles/profilesDb"
import { Logger } from "../debug/logger.shared"

export const HttpClientApiProvider = memo(function HttpClientApiProvider({
  children,
}: {
  children: ReactNode
}) {
  const queryClient = useQueryClient()

  const [httpClientApi] = useState(
    () =>
      new HttpApiClientWeb({
        onSessionChange: (session) => {
          queryClient.setQueryData(authQueryKey(session.nameHex), session)

          void Promise.resolve()
            .then(() => putProfileRow({ id: session.nameHex, auth: session }))
            .catch((error) => {
              Logger.error("Failed to persist auth session", error)
            })
        },
      }),
  )

  const { data: session } = useAuthSession()

  useEffect(
    function pushAuthSessionToHttpClient() {
      httpClientApi.setSession(session ?? null)
    },
    [httpClientApi, session],
  )

  return (
    <HttpClientApiContext.Provider value={httpClientApi}>
      {children}
    </HttpClientApiContext.Provider>
  )
})
