import { useEffect, useRef, useState } from "react"
import * as serviceWorkerRegistration from "./serviceWorkerRegistration"
import { Logger } from "../debug/logger.shared"
import { sendMessageToServiceWorker } from "./communication/communication.web"
import {
  runTaskMessage,
  SwTask,
  skipWaitingMessage,
} from "./communication/types.shared"
import { getProfile } from "../profiles/active/activeProfileId"

const BACKGROUND_TASK_INTERVAL_MS = 10 * 60 * 1000

export const useRegisterServiceWorker = () => {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | undefined>(
    undefined,
  )
  const firstTime = useRef(true)

  useEffect(function registerServiceWorkerOnce() {
    if (firstTime.current) {
      firstTime.current = false

      serviceWorkerRegistration.register({
        onSuccess: () => {
          Logger.info(`service worker registered with success!`)
        },
        onUpdate: (reg) => reg.waiting && setWaitingWorker(reg.waiting),
        onWaitingServiceWorkerFound: async (reg) => {
          reg.waiting && setWaitingWorker(reg.waiting)
        },
      })
    }
  }, [])

  useEffect(function reloadWhenServiceWorkerTakesControl() {
    if (!("serviceWorker" in navigator)) return

    const controllerchange = () => {
      Logger.log("New service worker has taken control of the page")

      if (import.meta.env.MODE === "development") return

      /**
       * We reload the page on service worker update because the entire web app
       * source code is likely changed, therefore we need to fill in the cache
       * with the new assets.
       */
      window.location.reload()
    }

    navigator.serviceWorker.addEventListener(
      "controllerchange",
      controllerchange,
    )

    return function removeControllerChangeListener() {
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        controllerchange,
      )
    }
  }, [])

  useEffect(function triggerBackgroundTasks() {
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

  /**
   * During dev, as soon as we detect a new service worker, we skip waiting.
   */
  useEffect(() => {
    if (import.meta.env.MODE === "development" && waitingWorker) {
      sendMessageToServiceWorker(waitingWorker, skipWaitingMessage())
    }
  }, [waitingWorker])

  return { waitingWorker }
}
