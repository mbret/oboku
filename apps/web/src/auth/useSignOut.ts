import { clearTemporaryMasterKey } from "./AuthorizeActionDialog"
import { SIGNAL_RESET } from "reactjrx"
import { clearActiveProfileId, getProfile, usePatchProfile } from "../profiles"
import { setUser } from "@sentry/react"
import { googleAccessTokenSignal } from "../google/auth"
import { usePluginsSignOut } from "../plugins/usePluginsSignOut"
import { useResetSessionQueries } from "../queries/resetSessionQueries"
import { Logger } from "../debug/logger.shared"
import { deleteProofKey } from "./proofKey"

export const useSignOut = () => {
  const signOutPlugins = usePluginsSignOut()
  const resetSessionQueries = useResetSessionQueries()
  const { mutateAsync: patchProfile } = usePatchProfile()

  return async () => {
    const activeProfileId = getProfile()

    /**
     * Deleting the non-extractable proof key first makes the sign-out
     * fail-closed even offline: without it the refresh token can never mint
     * another access token, so the session dies once the current access token
     * expires — regardless of whether the server-side revocation below ever
     * succeeds.
     */
    try {
      await deleteProofKey()
    } catch (error) {
      Logger.error("Failed to delete the refresh proof key on sign out", error)
    }

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
