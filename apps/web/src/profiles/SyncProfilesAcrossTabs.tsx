import { useQueryClient } from "@tanstack/react-query"
import { memo, useEffect } from "react"
import { useLiveRef } from "reactjrx"
import { useForgetAccountSessions } from "../auth/useForgetAccountSessions"
import { Logger } from "../debug/logger.shared"
import { resetSessionQueries } from "../queries/resetSessionQueries"
import { syncActiveProfileIdFromStorage } from "./active/activeProfileId"
import { profilesBroadcast } from "./profilesBroadcast"
import { profilesQueryKey } from "./useProfiles"

export const SyncProfilesAcrossTabs = memo(function SyncProfilesAcrossTabs() {
  const queryClient = useQueryClient()
  const forgetAccountSessions = useForgetAccountSessions()
  const forgetAccountSessionsRef = useLiveRef(forgetAccountSessions)

  useEffect(
    function mirrorProfileChangesFromOtherTabs() {
      return profilesBroadcast.subscribe(
        function refreshProfilesFromOtherTab() {
          const hasActiveProfileChanged = syncActiveProfileIdFromStorage()

          if (hasActiveProfileChanged) {
            forgetAccountSessionsRef.current()
            // Reset before the profiles refetch can start a revocation sweep
            // (see `useSignOut`).
            resetSessionQueries(queryClient).catch(Logger.error)
          }

          void queryClient.invalidateQueries({ queryKey: profilesQueryKey })
        },
      )
    },
    [queryClient, forgetAccountSessionsRef],
  )

  return null
})
