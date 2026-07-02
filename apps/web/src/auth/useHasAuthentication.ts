import { useSignalValue } from "reactjrx"
import type { AuthSession } from "./types"
import { authStateSignal } from "./states.web"

const selectHasAuthentication = (auth: AuthSession | null | undefined) =>
  auth !== null && auth !== undefined

export const useHasAuthentication = () =>
  useSignalValue(authStateSignal, selectHasAuthentication)
