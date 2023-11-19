import { memo, useEffect } from "react"
import { usePrefetchAccountSettings } from "./settings/helpers"
import { useLiveRef } from "reactjrx"

/**
 * For user convenience and sense of performance we will preload some queries
 * on startup so that we have initial data ready when UX is displayed.
 *
 * @important
 * This is purely for UX enhancement and is not meant to have more reliable data.
 *
 * Some if not most are all queries bound to rxdb observable which means that they
 * will stay live and fresh for the entire app runtime. This ensure that every new query
 * will share the same observable and directly get latest data upon mount.
 *
 * Do not keep expensive queries hot / live if not necessary as it would just keep
 * RAM usage high.
 */
export const PreloadQueries = memo(({ onReady }: { onReady: () => void }) => {
  const isAccountSettingsPreloaded = usePrefetchAccountSettings()
  const onReadyRef = useLiveRef(onReady)

  const isReady = isAccountSettingsPreloaded

  useEffect(() => {
    if (isReady) {
      onReadyRef.current()
    }
  }, [isReady, onReadyRef])

  return null
})
