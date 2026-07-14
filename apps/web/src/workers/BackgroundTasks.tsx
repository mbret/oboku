import { useEffect } from "react"
import { runTaskMessage, SwTask } from "./communication/types.shared"
import { getProfile } from "../profiles/active/activeProfileId"

const BACKGROUND_TASK_INTERVAL_MS = 10 * 60 * 1000

/**
 * Periodically asks the service worker to run background maintenance tasks
 * (currently the covers cache cleanup), passing the active profile so the
 * worker knows whose data to operate on. Fires once on mount, then on an
 * interval.
 */
export const BackgroundTasks = () => {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return

    const triggerBackgroundTasks = () => {
      navigator.serviceWorker.ready
        .then((registration) => {
          registration.active?.postMessage(
            runTaskMessage(SwTask.CoversCacheCleanup, getProfile()),
          )
        })
        .catch(() => {})
    }

    triggerBackgroundTasks()

    const intervalId = setInterval(
      triggerBackgroundTasks,
      BACKGROUND_TASK_INTERVAL_MS,
    )

    return () => clearInterval(intervalId)
  }, [])

  return null
}
