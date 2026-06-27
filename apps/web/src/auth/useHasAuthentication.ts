import { useSignalValue } from "reactjrx"
import type { AuthSession } from "./types"
import { authStateSignal } from "./states.web"

const selectHasAuthentication = (auth: AuthSession | null) => auth !== null

export const useHasAuthentication = () =>
  useSignalValue(authStateSignal, selectHasAuthentication)
