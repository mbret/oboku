import { memo, useEffect } from "react"
import { useObserve } from "reactjrx"
import { configuration } from "../../config/configuration"
import type { ObokuPlugin } from "../types"
import { initializeOneDriveSession } from "./auth/auth"

export const Provider: ObokuPlugin["Provider"] = memo(function Provider({
  children,
}) {
  const { data: configurationState } = useObserve(configuration)
  const isOneDriveEnabled =
    !!configurationState?.config.MICROSOFT_APPLICATION_CLIENT_ID

  useEffect(() => {
    if (!isOneDriveEnabled) {
      return
    }

    void initializeOneDriveSession()
  }, [isOneDriveEnabled])

  return <>{children}</>
})
