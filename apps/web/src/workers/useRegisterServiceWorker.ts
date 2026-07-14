import { useEffect, useRef, useState } from "react"
import * as serviceWorkerRegistration from "./serviceWorkerRegistration"
import { Logger } from "../debug/logger.shared"
import { sendMessageToServiceWorker } from "./communication/communication.web"
import { skipWaitingMessage } from "./communication/types.shared"

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

  /**
   * During dev, as soon as we detect a new service worker, we skip waiting.
   */
  useEffect(
    function skipWaitingForNewServiceWorkerInDev() {
      if (import.meta.env.MODE === "development" && waitingWorker) {
        sendMessageToServiceWorker(waitingWorker, skipWaitingMessage())
      }
    },
    [waitingWorker],
  )

  return { waitingWorker }
}
