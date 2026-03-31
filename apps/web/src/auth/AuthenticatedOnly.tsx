import { useSignalValue } from "reactjrx"
import { authStateSignal } from "./states.web"
import { memo, type ReactNode } from "react"

export const AuthenticatedOnly = memo(
  ({ children }: { children: ReactNode }) => {
    const auth = useSignalValue(authStateSignal)
    const isAuthenticated = !!auth?.accessToken

    if (!isAuthenticated) {
      return null
    }

    return <>{children}</>
  },
)
