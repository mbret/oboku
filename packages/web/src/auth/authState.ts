import { signal } from "reactjrx"

export const authStateSignal = signal<
  | {
      token: string
      email: string
      nameHex: string
      dbName: string
    }
  | undefined
>({
  key: "authState",
  default: undefined
})

export const authStatePersist = authStateSignal
