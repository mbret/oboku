import { useQueryClient } from "@tanstack/react-query"
import { memo, useEffect } from "react"
import { Logger } from "../debug/logger.shared"
import { resetSessionQueries } from "../queries/resetSessionQueries"
import { syncActiveProfileIdFromStorage } from "./active/activeProfileId"
import { profilesBroadcast } from "./profilesBroadcast"
import { profilesQueryKey } from "./useProfiles"

export const SyncProfilesAcrossTabs = memo(function SyncProfilesAcrossTabs() {
  const queryClient = useQueryClient()

  useEffect(
    function mirrorProfileChangesFromOtherTabs() {
      return profilesBroadcast.subscribe(
        function refreshProfilesFromOtherTab() {
          const hasActiveProfileChanged = syncActiveProfileIdFromStorage()

          // Reset before the profiles refetch can start a revocation sweep
          // (see `useSignOut`).
          if (hasActiveProfileChanged) {
            resetSessionQueries(queryClient).catch(Logger.error)
          }

          void queryClient.invalidateQueries({ queryKey: profilesQueryKey })
        },
      )
    },
    [queryClient],
  )

  return null
})
