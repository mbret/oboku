import { clearTemporaryMasterKey } from "./AuthorizeActionDialog"
import { authStateSignal } from "./states.web"
import { SIGNAL_RESET } from "reactjrx"
import { removeProfile, currentProfileSignal } from "../profiles"
import { setUser } from "@sentry/react"
import { googleAccessTokenSignal } from "../google/auth"
import { usePluginsSignOut } from "../plugins/usePluginsSignOut"
import { useResetSessionQueries } from "../queries/useResetSessionQueries"

export const useSignOut = () => {
  const signOutPlugins = usePluginsSignOut()
  const resetSessionQueries = useResetSessionQueries()

  return () => {
    clearTemporaryMasterKey()
    authStateSignal.update(SIGNAL_RESET)
    googleAccessTokenSignal.update(SIGNAL_RESET)

    setUser(null)

    removeProfile()
    currentProfileSignal.setValue(SIGNAL_RESET)

    resetSessionQueries()

    signOutPlugins()
  }
}
