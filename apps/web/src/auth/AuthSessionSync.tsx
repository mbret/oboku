import { memo, useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useHttpClientApi } from "../http"
import { Logger } from "../debug/logger.shared"
import { putProfileRow } from "../profiles/dbHelpers"
import { authQueryKey, useAuthSession } from "./authSession"

export const AuthSessionSync = memo(function AuthSessionSync() {
  const queryClient = useQueryClient()
  const httpClientApi = useHttpClientApi()
  const { data: session } = useAuthSession()

  useEffect(
    function pushAuthSessionToHttpClient() {
      httpClientApi.setSession(session ?? null)
    },
    [httpClientApi, session],
  )

  useEffect(
    function persistHttpClientSessionChanges() {
      return httpClientApi.onSessionChange(
        function writeSessionToCache(nextSession) {
          queryClient.setQueryData(
            authQueryKey(nextSession.nameHex),
            nextSession,
          )

          void Promise.resolve()
            .then(() =>
              putProfileRow({ id: nextSession.nameHex, ...nextSession }),
            )
            .catch((error) => {
              Logger.error("Failed to persist auth session", error)
            })
        },
      )
    },
    [httpClientApi, queryClient],
  )

  return null
})
