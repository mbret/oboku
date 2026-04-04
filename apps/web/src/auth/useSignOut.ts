import { clearTemporaryMasterKey } from "./AuthorizeActionDialog"
import { authStateSignal } from "./states.web"
import { SIGNAL_RESET } from "reactjrx"
import { removeProfile } from "../profile/currentProfile"
import { setUser } from "@sentry/react"
import { currentProfileSignal } from "../profile/currentProfile"
import { googleAccessTokenSignal } from "../google/auth"
import { usePluginsSignOut } from "../plugins/usePluginsSignOut"
import { queryClient } from "../queries/queryClient"
import { persister } from "../queries/persister"

export const useSignOut = () => {
  const signOutPlugins = usePluginsSignOut()

  return () => {
    clearTemporaryMasterKey()
    authStateSignal.update(SIGNAL_RESET)
    googleAccessTokenSignal.update(SIGNAL_RESET)

    setUser(null)

    removeProfile()
    currentProfileSignal.setValue(SIGNAL_RESET)

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
