import { useEffect, useRef, useState } from "react"
import { filter, fromEvent, map, pairwise, startWith } from "rxjs"
import * as serviceWorkerRegistration from "./serviceWorkerRegistration"
import { reloadPage } from "../common/browser"
import { Logger } from "../debug/logger.shared"
import { sendMessageToServiceWorker } from "./communication/communication.web"
import { skipWaitingMessage } from "./communication/types.shared"

type ControllerChange = [
  earlierController: ServiceWorker | null,
  controller: ServiceWorker | null,
]

const hasEarlierController = ([earlierController]: ControllerChange) =>
  earlierController !== null

/**
 * Emits when a new service worker replaces the one that controls the page. The
 * first worker to claim an uncontrolled page replaces none: the page came from
 * the network and already runs the build that worker serves.
 */
const fromControllerReplacement = (container: ServiceWorkerContainer) =>
  fromEvent(container, "controllerchange").pipe(
    startWith(null),
    map(() => container.controller),
    pairwise(),
    filter(hasEarlierController),
  )

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

  useEffect(function reloadWhenNewServiceWorkerReplacesController() {
    if (!("serviceWorker" in navigator)) return

    const subscription = fromControllerReplacement(
      navigator.serviceWorker,
    ).subscribe(function reloadIntoNewVersion() {
      Logger.log("New service worker has replaced the page controller")

      if (import.meta.env.MODE === "development") return

      reloadPage()
    })

    return function stopWatchingControllerReplacement() {
      subscription.unsubscribe()
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
