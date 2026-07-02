import { useSignalValue } from "reactjrx"
import type { AuthSession } from "./types"
import { authStateSignal } from "./states.web"

const selectIsAuthenticated = (auth: AuthSession | null | undefined) => {
  return auth !== null && auth !== undefined && !auth.needsRelogin
}

export const useIsAuthenticated = () =>
  useSignalValue(authStateSignal, selectIsAuthenticated)
