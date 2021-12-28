/**
 * @see https://github.com/mikeesto/use-wake-lock/blob/master/src/index.js
 */

import { useEffect, useState } from "react";
import { Report } from "../debug/report.shared";
import { PromiseReturnType } from "../types";

export const useWakeLock = () => {
  const [active, setActive] = useState(false)

  useEffect(() => {
    let wakeLock: PromiseReturnType<typeof navigator.wakeLock.request> | null = null;
    let mounted = true
    const onRelease = () => {
      if (mounted) {
        setActive(false)
      }
    }

    (async () => {
      if ('wakeLock' in navigator) {
        try {
          wakeLock = await navigator.wakeLock.request('screen');
          setActive(true)
          wakeLock.addEventListener('release', onRelease)
        } catch (err) {
          Report.error(err)
        }
      }
    })()

    return () => {
      mounted = false
      if (wakeLock) {
        wakeLock.removeEventListener('release', onRelease)
        wakeLock.release().catch(Report.error)
      }
    }
  }, [])

  return active
}