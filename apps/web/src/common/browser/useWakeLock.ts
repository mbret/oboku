/**
 * @see https://github.com/mikeesto/use-wake-lock/blob/master/src/index.js
 */

import { useEffect, useState } from "react"
import { Logger } from "../../debug/logger.shared"
import type { PromiseReturnType } from "../../types"

type WakeLockSentinel = PromiseReturnType<typeof navigator.wakeLock.request>

const isWakeLockSupported = () => "wakeLock" in navigator

const isDocumentVisible = () => document.visibilityState === "visible"

export const useWakeLock = ({ enabled = true }: { enabled?: boolean } = {}) => {
  const [isWakeLockActive, setIsWakeLockActive] = useState(false)

  useEffect(
    function keepScreenAwakeWhileMounted() {
      let currentWakeLock: WakeLockSentinel | null = null
      let isHookMounted = true

      const onWakeLockReleasedByOs = () => {
        Logger.info("wakeLock: released")

        if (isHookMounted) {
          setIsWakeLockActive(false)
        }
      }

      const acquireWakeLock = async () => {
        const isAlreadyHeld = currentWakeLock !== null

        if (
          !enabled ||
          !isHookMounted ||
          isAlreadyHeld ||
          !isDocumentVisible()
        ) {
          return
        }

        if (!isWakeLockSupported()) {
          return
        }

        try {
          const requestedWakeLock = await navigator.wakeLock.request("screen")

          const wasUnmountedWhileRequesting = !isHookMounted

          if (wasUnmountedWhileRequesting) {
            requestedWakeLock.release().catch(Logger.error)
            return
          }

          currentWakeLock = requestedWakeLock
          Logger.info("wakeLock: acquired")
          setIsWakeLockActive(true)
          currentWakeLock.addEventListener("release", onWakeLockReleasedByOs)
        } catch (error) {
          Logger.error("wakeLock: failed to acquire")
          Logger.error(error)
        }
      }

      const reacquireWakeLockWhenVisibleAgain = () => {
        if (isDocumentVisible()) {
          currentWakeLock = null
          void acquireWakeLock()
        }
      }

      void acquireWakeLock()

      document.addEventListener(
        "visibilitychange",
        reacquireWakeLockWhenVisibleAgain,
      )

      return function releaseWakeLockOnUnmount() {
        isHookMounted = false
        document.removeEventListener(
          "visibilitychange",
          reacquireWakeLockWhenVisibleAgain,
        )

        if (currentWakeLock) {
          currentWakeLock.removeEventListener("release", onWakeLockReleasedByOs)
          currentWakeLock.release().catch(Logger.error)
        }
      }
    },
    [enabled],
  )

  return isWakeLockActive
}
