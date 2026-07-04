import { clearTemporaryMasterKey } from "./AuthorizeActionDialog"
import { SIGNAL_RESET } from "reactjrx"
import { clearActiveProfileId, getProfile, usePatchProfile } from "../profiles"
import { setUser } from "@sentry/react"
import { googleAccessTokenSignal } from "../google/auth"
import { usePluginsSignOut } from "../plugins/usePluginsSignOut"
import { useResetSessionQueries } from "../queries/resetSessionQueries"
import { Logger } from "../debug/logger.shared"
import { useRevokeLoggedOutProfiles } from "./useRevokeLoggedOutProfiles"

export const useSignOut = () => {
  const signOutPlugins = usePluginsSignOut()
  const resetSessionQueries = useResetSessionQueries()
  const { mutateAsync: patchProfile } = usePatchProfile()
  const revokeLoggedOutProfiles = useRevokeLoggedOutProfiles()

  return async () => {
    const activeProfileId = getProfile()

    clearTemporaryMasterKey()
    googleAccessTokenSignal.update(SIGNAL_RESET)

    setUser(null)

    clearActiveProfileId()

    /**
     * The profile row is kept as a `loggedOut` tombstone rather than deleted:
     * its refresh token is the credential the (possibly offline) revocation
     * sweep needs to kill the server session. The row is deleted once
     * revocation succeeds (see `useRevokeLoggedOutProfiles`).
     */
    if (activeProfileId) {
      try {
        await patchProfile({ id: activeProfileId, status: "loggedOut" })
      } catch (error) {
        Logger.error("Failed to flag profile as logged out on sign out", error)
      }
    }

    resetSessionQueries()

    signOutPlugins()

    void revokeLoggedOutProfiles()
  }
}
