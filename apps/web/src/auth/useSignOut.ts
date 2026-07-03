import { clearTemporaryMasterKey } from "./AuthorizeActionDialog"
import { SIGNAL_RESET } from "reactjrx"
import { clearActiveProfileId, getProfile, useDeleteProfile } from "../profiles"
import { setUser } from "@sentry/react"
import { googleAccessTokenSignal } from "../google/auth"
import { usePluginsSignOut } from "../plugins/usePluginsSignOut"
import { useResetSessionQueries } from "../queries/useResetSessionQueries"
import { Logger } from "../debug/logger.shared"

export const useSignOut = () => {
  const signOutPlugins = usePluginsSignOut()
  const resetSessionQueries = useResetSessionQueries()
  const { mutateAsync: deleteProfile } = useDeleteProfile()

  return async () => {
    const activeProfileId = getProfile()

    clearTemporaryMasterKey()
    googleAccessTokenSignal.update(SIGNAL_RESET)

    setUser(null)

    clearActiveProfileId()

    if (activeProfileId) {
      try {
        await deleteProfile(activeProfileId)
      } catch (error) {
        Logger.error("Failed to delete profile on sign out", error)
      }
    }

    resetSessionQueries()

    signOutPlugins()
  }
}
