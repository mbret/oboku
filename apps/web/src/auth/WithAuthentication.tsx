import { memo, type ReactNode } from "react"
import { useActiveProfile } from "../profiles"

export const WithAuthentication = memo(function WithAuthentication({
  children,
}: {
  children: ReactNode
}) {
  const hasSession = !!useActiveProfile().data

  if (!hasSession) {
    return null
  }

  return <>{children}</>
})
