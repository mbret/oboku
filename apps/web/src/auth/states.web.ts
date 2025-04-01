import { createLocalStorageAdapter, signal, usePersistSignals } from "reactjrx"
import type { AuthSession } from "./types"

export const authStateSignal = signal<AuthSession | null>({
  key: "authState",
  default: null,
})

export const adapter = createLocalStorageAdapter({
  key: `auth`,
})

const entries = [{ signal: authStateSignal, version: 0 }]

export const usePersistAuthState = () => {
  return usePersistSignals({
    adapter,
    entries,
  })
}
