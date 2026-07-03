import { memo, useEffect } from "react"
import { useHttpClientApi } from "../http"
import { Logger } from "../debug/logger.shared"
import { useActiveProfile, usePutProfile } from "../profiles"

export const SyncAuthSessionWithHttpApiClient = memo(
  function AuthSessionSync() {
    const httpClientApi = useHttpClientApi()
    const { data: session } = useActiveProfile()
    const { mutate: putProfile } = usePutProfile()

    useEffect(
      function pushAuthSessionToHttpClient() {
        httpClientApi.setSession(session ?? null)
      },
      [httpClientApi, session],
    )

    useEffect(
      function persistHttpClientSessionChanges() {
        return httpClientApi.onSessionChange(
          function persistSession(nextSession) {
            putProfile(nextSession, {
              onError: (error) => {
                Logger.error("Failed to persist auth session", error)
              },
            })
          },
        )
      },
      [httpClientApi, putProfile],
    )

    return null
  },
)
