import { useCallback, useEffect, useRef, useState } from "react"
import * as serviceWorkerRegistration from "./serviceWorkerRegistration"
import { Logger } from "../debug/logger.shared"
import {
  webCommunication,
  WebCommunication,
} from "./communication/communication.web"
import {
  ConfigurationChangeMessage,
  NotifyAuthMessage,
  SkipWaitingMessage,
} from "./communication/types.shared"
import { useSubscribe } from "reactjrx"
import { configuration } from "../config/configuration"
import { distinctUntilKeyChanged, tap } from "rxjs"
import { isShallowEqual } from "@oboku/shared"
import { authStateSignal } from "../auth/states.web"

export const useRegisterServiceWorker = () => {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | undefined>(
    undefined,
  )
  const firstTime = useRef(true)

  useEffect(() => {
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

  useEffect(() => {
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

    return () => {
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        controllerchange,
      )
    }
  }, [])

  /**
   * During dev, as soon as we detect a new service worker, we skip waiting.
   */
  useEffect(() => {
    if (import.meta.env.MODE === "development" && !!waitingWorker) {
      WebCommunication.sendMessage(waitingWorker, new SkipWaitingMessage())
    }
  }, [waitingWorker])

  const sendConfigurationChangeMessage = useCallback(
    () =>
      configuration.pipe(
        distinctUntilKeyChanged("config", isShallowEqual),
        tap(() => {
          webCommunication.sendMessage(
            new ConfigurationChangeMessage({
              API_COUCH_URI: configuration.API_COUCH_URI,
              API_URL: configuration.API_URL,
            }),
          )
        }),
      ),
    [],
  )
  useSubscribe(sendConfigurationChangeMessage)

  const sendNotifyAuthMessage = useCallback(
    () =>
      authStateSignal.pipe(
        tap((auth) => {
          webCommunication.sendMessage(new NotifyAuthMessage(auth))
        }),
      ),
    [],
  )

  useSubscribe(sendNotifyAuthMessage)

  return { waitingWorker }
}
