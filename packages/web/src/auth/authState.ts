import { signal, withPersistance } from "reactjrx"

export const [authStatePersist, useAuthState, setAuthState, getAuthState] = withPersistance(
  signal<
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
)
