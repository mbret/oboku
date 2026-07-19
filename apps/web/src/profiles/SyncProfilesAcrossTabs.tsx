import { useQueryClient } from "@tanstack/react-query"
import { memo, useEffect } from "react"
import { syncActiveProfileIdFromStorage } from "./active/activeProfileId"
import { profilesBroadcast } from "./profilesBroadcast"
import { profilesQueryKey } from "./useProfiles"

export const SyncProfilesAcrossTabs = memo(function SyncProfilesAcrossTabs() {
  const queryClient = useQueryClient()

  useEffect(
    function mirrorProfileChangesFromOtherTabs() {
      return profilesBroadcast.subscribe(
        function refreshProfilesFromOtherTab() {
          syncActiveProfileIdFromStorage()
          void queryClient.invalidateQueries({ queryKey: profilesQueryKey })
        },
      )
    },
    [queryClient],
  )

  return null
})
