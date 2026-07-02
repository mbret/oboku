import { clearTemporaryMasterKey } from "./AuthorizeActionDialog"
import { SIGNAL_RESET } from "reactjrx"
import { clearActiveProfileId, deleteProfileRow, getProfile } from "../profiles"
import { setUser } from "@sentry/react"
import { googleAccessTokenSignal } from "../google/auth"
import { usePluginsSignOut } from "../plugins/usePluginsSignOut"
import { useQueryClient } from "@tanstack/react-query"
import { profileByIdQueryKey } from "./authSession"
import { useResetSessionQueries } from "../queries/useResetSessionQueries"

export const useSignOut = () => {
  const signOutPlugins = usePluginsSignOut()
  const queryClient = useQueryClient()
  const resetSessionQueries = useResetSessionQueries()

  return () => {
    const activeProfileId = getProfile()

    clearTemporaryMasterKey()
    googleAccessTokenSignal.update(SIGNAL_RESET)

    setUser(null)

    clearActiveProfileId()

    if (activeProfileId) {
      queryClient.removeQueries({
        queryKey: profileByIdQueryKey(activeProfileId),
      })
      void deleteProfileRow(activeProfileId)
    }

    resetSessionQueries()

    signOutPlugins()
  }
}
