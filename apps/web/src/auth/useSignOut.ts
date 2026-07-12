import { clearTemporaryMasterKey } from "./AuthorizeActionDialog"
import { SIGNAL_RESET } from "reactjrx"
import { clearActiveProfileId, getProfile, usePatchProfile } from "../profiles"
import { setUser } from "@sentry/react"
import { googleAccessTokenSignal } from "../google/auth"
import { usePluginsSignOut } from "../plugins/usePluginsSignOut"
import { useResetSessionQueries } from "../queries/resetSessionQueries"
import { Logger } from "../debug/logger.shared"
import { deleteProofKey } from "./proofKey"
import { useReCreateDb } from "../rxdb"
import { purgeAllDownloads } from "../download/purgeAllDownloads"

export const useSignOut = () => {
  const signOutPlugins = usePluginsSignOut()
  const resetSessionQueries = useResetSessionQueries()
  const { mutateAsync: patchProfile } = usePatchProfile()
  const { mutateAsync: reCreateDb } = useReCreateDb()

  return async () => {
    const activeProfileId = getProfile()

    /**
     * Deleting the non-extractable proof key first makes the sign-out
     * fail-closed even offline: without it the refresh cookie can never mint
     * another access token, so the session dies once the current ≤5-minute
     * access cookie expires — regardless of whether the server-side
     * revocation below ever succeeds.
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

    /**
     * Sign-out removes this device's copy of the account's data, not just the
     * session: the replicated library survives in IndexedDB otherwise, readable
     * to anyone on a shared device. The two stores are wiped independently so a
     * failure of one still attempts the other. Server-backed books re-download
     * after the next sign-in; device-local (`file` plugin) books do not, which
     * is why the sign-out UI warns before reaching here (see `ProfileScreen`).
     */
    try {
      await reCreateDb({ overwrite: true })
    } catch (error) {
      Logger.error("Failed to wipe the local database on sign out", error)
    }

    try {
      await purgeAllDownloads()
    } catch (error) {
      Logger.error("Failed to purge downloaded files on sign out", error)
    }

    // Reset before writing the tombstone: the write triggers the revocation
    // sweep, and clearing the mutation cache after the sweep starts would
    // void its scope serialization. Await the snapshot flush so a reload right
    // after sign-out cannot rehydrate the previous session's cached data.
    await resetSessionQueries()

    /**
     * The profile row is kept as a `loggedOut` tombstone rather than deleted:
     * it marks a server session that still awaits revocation (the refresh
     * cookie is the credential). This write is also what triggers the sweep,
     * which deletes the row once revocation succeeds
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
