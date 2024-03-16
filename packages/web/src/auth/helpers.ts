import { useCallback } from "react"
import { authStateSignal } from "./authState"
import { SIGNAL_RESET, useSignalValue } from "reactjrx"
import { removeProfile } from "../profile/currentProfile"
import { setUser } from "@sentry/react"

export const useIsAuthenticated = () => !!useSignalValue(authStateSignal)?.token

export const useSignOut = () => {
  return useCallback(() => {
    authStateSignal.setValue(SIGNAL_RESET)

    setUser(null)

    removeProfile()
  }, [])
}
