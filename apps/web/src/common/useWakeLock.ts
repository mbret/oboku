/**
 * @see https://github.com/mikeesto/use-wake-lock/blob/master/src/index.js
 */

import { useEffect, useState } from "react"
import { Logger } from "../debug/logger.shared"
import type { PromiseReturnType } from "../types"

export const useWakeLock = () => {
  const [active, setActive] = useState(false)

  useEffect(() => {
    let wakeLock: PromiseReturnType<typeof navigator.wakeLock.request> | null =
      null
    let mounted = true

    const onRelease = () => {
      if (mounted) {
        setActive(false)
      }
    }

    ;(async () => {
      if ("wakeLock" in navigator) {
        try {
          wakeLock = await navigator.wakeLock.request("screen")
          setActive(true)
          wakeLock.addEventListener("release", onRelease)
        } catch (err) {
          Logger.error(err)
        }
      }
    })()

    return () => {
      mounted = false
      if (wakeLock) {
        wakeLock.removeEventListener("release", onRelease)
        wakeLock.release().catch(Logger.error)
      }
    }
  }, [])

  return active
}
