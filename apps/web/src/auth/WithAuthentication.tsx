import { memo, type ReactNode } from "react"
import { useHasAuthentication } from "./useHasAuthentication"

export const WithAuthentication = memo(
  ({ children }: { children: ReactNode }) => {
    const hasSession = useHasAuthentication()

    if (!hasSession) {
      return null
    }

    return <>{children}</>
  },
)
