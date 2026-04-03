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

    queryClient.clear()
    persister.removeClient()

    signOutPlugins()
  }
}
