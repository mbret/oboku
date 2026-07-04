import { clearTemporaryMasterKey } from "./AuthorizeActionDialog"
import { SIGNAL_RESET } from "reactjrx"
import { clearActiveProfileId, getProfile, usePatchProfile } from "../profiles"
import { setUser } from "@sentry/react"
import { googleAccessTokenSignal } from "../google/auth"
import { usePluginsSignOut } from "../plugins/usePluginsSignOut"
import { useResetSessionQueries } from "../queries/resetSessionQueries"
import { Logger } from "../debug/logger.shared"

export const useSignOut = () => {
  const signOutPlugins = usePluginsSignOut()
  const resetSessionQueries = useResetSessionQueries()
  const { mutateAsync: patchProfile } = usePatchProfile()

  return async () => {
    const activeProfileId = getProfile()

    clearTemporaryMasterKey()
    googleAccessTokenSignal.update(SIGNAL_RESET)

    setUser(null)

    clearActiveProfileId()

    // Reset before writing the tombstone: the write triggers the revocation
    // sweep, and clearing the mutation cache after the sweep starts would
    // void its scope serialization.
    resetSessionQueries()

    /**
     * The profile row is kept as a `loggedOut` tombstone rather than deleted:
     * its refresh token is the credential the (possibly offline) revocation
     * sweep needs to kill the server session. This write is also what
     * triggers the sweep, which deletes the row once revocation succeeds
     * (see `RevokeLoggedOutProfiles`).
     */
    if (activeProfileId) {
      try {
        await patchProfile({ id: activeProfileId, status: "loggedOut" })
      } catch (error) {
        Logger.error("Failed to flag profile as logged out on sign out", error)
      }
    }

    signOutPlugins()
  }
}
