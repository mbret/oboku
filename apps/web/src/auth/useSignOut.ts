import { clearTemporaryMasterKey } from "./AuthorizeActionDialog"
import { SIGNAL_RESET } from "reactjrx"
import { clearActiveProfileId, deleteProfileRow, getProfile } from "../profiles"
import { setUser } from "@sentry/react"
import { googleAccessTokenSignal } from "../google/auth"
import { usePluginsSignOut } from "../plugins/usePluginsSignOut"
import { persister } from "../queries/persister"
import { useQueryClient } from "@tanstack/react-query"
import { authQueryKey } from "./authSession"

export const useSignOut = () => {
  const signOutPlugins = usePluginsSignOut()
  const queryClient = useQueryClient()

  return () => {
    const activeProfileId = getProfile()

    clearTemporaryMasterKey()
    googleAccessTokenSignal.update(SIGNAL_RESET)

    setUser(null)

    clearActiveProfileId(queryClient)

    if (activeProfileId) {
      queryClient.removeQueries({ queryKey: authQueryKey(activeProfileId) })
      void deleteProfileRow(activeProfileId)
    }

    /**
     * Prefer `resetQueries` over `clear` on sign-out: `clear` removes every
     * query and cancels in-flight work, but mounted observers may not run a new
     * fetch right away, which can leave screens stuck until remount.
     * `resetQueries` resets state and refetches **active** queries (still
     * skipped when `enabled` is false after auth clears). Mutations are cleared
     * separately because `resetQueries` only touches the query cache.
     */
    void queryClient.resetQueries()
    queryClient.getMutationCache().clear()
    void persister.removeClient()

    signOutPlugins()
  }
}
