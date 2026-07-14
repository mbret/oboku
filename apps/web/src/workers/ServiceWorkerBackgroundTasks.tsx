import { memo, useEffect } from "react"
import { runTaskMessage, SwTask } from "./communication/types.shared"
import { useActiveProfileId } from "../profiles/active/activeProfileId"

const SW_BACKGROUND_TASK_INTERVAL_MS = 10 * 60 * 1000

const postTaskWhenReady = (task: SwTask, profile: string | undefined) => {
  const abortController = new AbortController()

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        if (abortController.signal.aborted) return

        registration.active?.postMessage(runTaskMessage(task, profile))
      })
      .catch(() => {})
  }

  return function abortPendingPost() {
    abortController.abort()
  }
}

export const ServiceWorkerBackgroundTasks = memo(
  function ServiceWorkerBackgroundTasks() {
    const activeProfileId = useActiveProfileId()

    useEffect(
      function runCoversCacheCleanupPeriodically() {
        const triggerCoversCacheCleanup = () =>
          postTaskWhenReady(SwTask.CoversCacheCleanup, activeProfileId)

        const abortInitialPost = triggerCoversCacheCleanup()

        const intervalId = setInterval(
          triggerCoversCacheCleanup,
          SW_BACKGROUND_TASK_INTERVAL_MS,
        )

        return function stopCoversCacheCleanup() {
          clearInterval(intervalId)
          abortInitialPost()
        }
      },
      [activeProfileId],
    )

    useEffect(function cleanupOldRxdbDatabasesOnStartup() {
      return postTaskWhenReady(SwTask.OldRxdbDatabasesCleanup, undefined)
    }, [])

    return null
  },
)
