import { authStateSignal } from "./states.web"
import { SIGNAL_RESET } from "reactjrx"
import { removeProfile } from "../profile/currentProfile"
import { setUser } from "@sentry/react"
import { currentProfileSignal } from "../profile/currentProfile"
import { plugins } from "../plugins/configure"
import { googleAccessTokenSignal } from "../google/auth"

export const useSignOut = () => {
  // biome-ignore lint/correctness/useHookAtTopLevel: Expected
  const pluginSignOutFns = plugins.map((plugin) => plugin.useSignOut?.())

  return () => {
    authStateSignal.update(SIGNAL_RESET)
    googleAccessTokenSignal.update(SIGNAL_RESET)

    setUser(null)

    removeProfile()
    currentProfileSignal.setValue(SIGNAL_RESET)

    pluginSignOutFns.forEach((pluginSignOutFn) => {
      pluginSignOutFn?.()
    })
  }
}
