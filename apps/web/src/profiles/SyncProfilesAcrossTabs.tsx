import { useQueryClient } from "@tanstack/react-query"
import { memo, useEffect } from "react"
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

          // Reset before the profiles refetch, which can start a revocation
          // sweep: clearing the mutation cache after it starts would void its
          // scope serialization.
          if (hasActiveProfileChanged) {
            void resetSessionQueries(queryClient)
          }

          void queryClient.invalidateQueries({ queryKey: profilesQueryKey })
        },
      )
    },
    [queryClient],
  )

  return null
})
