import { createLocalStorageAdapter, signal, usePersistSignals } from "reactjrx"

export const authStateSignal = signal<
  | {
      accessToken: string
      refreshToken: string
      email: string
      nameHex: string
      dbName: string
    }
  | undefined
>({
  key: "authState",
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
