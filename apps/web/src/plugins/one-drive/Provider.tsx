import { memo, useEffect } from "react"
import { useConfig } from "../../config/useConfig"
import type { ObokuPlugin } from "../types"
import { initializeOneDriveSession } from "./auth/auth"

export const Provider: ObokuPlugin["Provider"] = memo(function Provider({
  children,
}) {
  const { data: config } = useConfig()
  const clientId = config?.MICROSOFT_APPLICATION_CLIENT_ID
  const authority = config?.MICROSOFT_APPLICATION_AUTHORITY

  useEffect(() => {
    if (!clientId) {
      return
    }

    void initializeOneDriveSession({ clientId, authority })
  }, [clientId, authority])

  return <>{children}</>
})
