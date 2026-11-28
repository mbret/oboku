import { useQueryClient } from "@tanstack/react-query"
import { memo, useEffect, useEffectEvent } from "react"
import { useForgetAccountSessions } from "../auth/useForgetAccountSessions"
import { reloadPage } from "../common/browser"
import { Logger } from "../debug/logger.shared"
import { resetSessionQueries } from "../queries/resetSessionQueries"
import { reopenDatabase } from "../rxdb/RxDbProvider"
import { syncActiveProfileIdFromStorage } from "./active/activeProfileId"
import { profilesBroadcast } from "./profilesBroadcast"
import { profilesQueryKey } from "./useProfiles"

export const SyncProfilesAcrossTabs = memo(function SyncProfilesAcrossTabs() {
  const queryClient = useQueryClient()
  const forgetAccountSessions = useForgetAccountSessions()

  const refreshProfilesFromOtherTab = useEffectEvent(
    function refreshProfilesFromOtherTab() {
      const hasActiveProfileChanged = syncActiveProfileIdFromStorage()

      if (hasActiveProfileChanged) {
        forgetAccountSessions()
        reopenDatabase().catch(function reloadTabLeftWithoutDatabase(
          error: unknown,
        ) {
          Logger.error(error)
          reloadPage()
        })
        // Reset before the profiles refetch can start a revocation sweep
        // (see `useSignOut`).
        resetSessionQueries(queryClient).catch(Logger.error)
      }

      void queryClient.invalidateQueries({ queryKey: profilesQueryKey })
    },
  )

  useEffect(function mirrorProfileChangesFromOtherTabs() {
    return profilesBroadcast.subscribe(function onProfilesChangedInOtherTab() {
      refreshProfilesFromOtherTab()
    })
  }, [])

  return null
})
