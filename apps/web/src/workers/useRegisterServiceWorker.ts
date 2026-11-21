import { useEffect, useRef, useState } from "react"
import { filter, fromEvent, map, pairwise, startWith } from "rxjs"
import * as serviceWorkerRegistration from "./serviceWorkerRegistration"
import { reloadPage } from "../common/browser"
import { Logger } from "../debug/logger.shared"
import { sendMessageToServiceWorker } from "./communication/communication.web"
import { skipWaitingMessage } from "./communication/types.shared"

/**
 * The first worker to claim an uncontrolled page is not a new version: the
 * page came from the network and already runs the build that worker serves.
 */
const fromNewVersionTakingControl = (
  container: ServiceWorkerContainer,
  offeredUpdate: ServiceWorker | undefined,
) =>
  fromEvent(container, "controllerchange").pipe(
    startWith(null),
    map(() => container.controller),
    pairwise(),
    filter(function isNewVersion([earlierController, controller]) {
      const isReplacingController = earlierController !== null
      const isOfferedUpdate = controller === offeredUpdate

      return isReplacingController || isOfferedUpdate
    }),
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

  useEffect(
    function reloadWhenNewVersionTakesControl() {
      if (!("serviceWorker" in navigator)) return

      const subscription = fromNewVersionTakingControl(
        navigator.serviceWorker,
        waitingWorker,
      ).subscribe(function reloadIntoNewVersion() {
        Logger.log("New version of the app has taken control of the page")

        if (import.meta.env.MODE === "development") return

        reloadPage()
      })

      return function stopWatchingNewVersion() {
        subscription.unsubscribe()
      }
    },
    [waitingWorker],
  )

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
