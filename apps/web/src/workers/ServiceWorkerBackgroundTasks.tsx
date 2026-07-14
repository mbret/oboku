import { memo, useEffect } from "react"
import { runTaskMessage, SwTask } from "./communication/types.shared"
import { useActiveProfileId } from "../profiles/active/activeProfileId"

const SW_BACKGROUND_TASK_INTERVAL_MS = 10 * 60 * 1000

const postTaskWhenReady = (
  task: SwTask,
  profile: string | undefined,
  signal: AbortSignal,
) => {
  if (!("serviceWorker" in navigator)) return

  navigator.serviceWorker.ready
    .then((registration) => {
      if (signal.aborted) return

      registration.active?.postMessage(runTaskMessage(task, profile))
    })
    .catch(() => {})
}

export const ServiceWorkerBackgroundTasks = memo(
  function ServiceWorkerBackgroundTasks() {
    const activeProfileId = useActiveProfileId()

    useEffect(
      function runCoversCacheCleanupPeriodically() {
        const abortController = new AbortController()
        const triggerCoversCacheCleanup = () =>
          postTaskWhenReady(
            SwTask.CoversCacheCleanup,
            activeProfileId,
            abortController.signal,
          )

        triggerCoversCacheCleanup()

        const intervalId = setInterval(
          triggerCoversCacheCleanup,
          SW_BACKGROUND_TASK_INTERVAL_MS,
        )

        return function stopCoversCacheCleanup() {
          clearInterval(intervalId)
          abortController.abort()
        }
      },
      [activeProfileId],
    )

    useEffect(function cleanupOldRxdbDatabasesOnStartup() {
      const abortController = new AbortController()

      postTaskWhenReady(
        SwTask.OldRxdbDatabasesCleanup,
        undefined,
        abortController.signal,
      )

      return function abortPendingRxdbCleanupPost() {
        abortController.abort()
      }
    }, [])

    return null
  },
)
