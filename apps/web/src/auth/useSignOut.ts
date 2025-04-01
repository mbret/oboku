import { useCallback } from "react"
import { authStateSignal } from "./states.web"
import { SIGNAL_RESET } from "reactjrx"
import { removeProfile } from "../profile/currentProfile"
import { setUser } from "@sentry/react"
import { currentProfileSignal } from "../profile/currentProfile"

export const useSignOut = () => {
  return useCallback(() => {
    authStateSignal.update(SIGNAL_RESET)

    setUser(null)

    removeProfile()
    currentProfileSignal.setValue(SIGNAL_RESET)
  }, [])
}
