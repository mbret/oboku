import { EMPTY, fromEvent, merge, tap } from "rxjs"
import {
  type AppMessage,
  type MessageOf,
  configurationChangeMessage,
  notifyAuthMessage,
  parseMessage,
} from "./types.shared"
import { authStateSignal } from "../../auth/states.web"
import { Logger } from "../../debug/logger.shared"
import { configuration } from "../../config/configuration"
import { refreshAuthSession } from "../../http/httpClientApi.web"

export class WebCommunication {
  constructor() {
    const listenIncomingMessages$ = this.listenIncomingMessages()

    merge(listenIncomingMessages$).subscribe()
  }

  /**
   * Automatically listen to incoming messages from the service worker
   */
  private listenIncomingMessages() {
    if (!("serviceWorker" in navigator)) {
      return EMPTY
    }

    return fromEvent(navigator.serviceWorker, "message").pipe(
      tap((event) => {
        const message = parseMessage("data" in event ? event.data : undefined)

        if (!message) return

        const replyPort =
          event instanceof MessageEvent ? event.ports[0] : undefined
        const serviceWorker =
          event instanceof MessageEvent
            ? event.source
            : navigator.serviceWorker.controller

        Logger.log(
          ["communication:web"],
          "received message from service worker",
          message,
        )

        const reply = (
          message:
            | MessageOf<"CONFIGURATION_CHANGE">
            | MessageOf<"NotifyAuthMessage">,
        ) => {
          if (replyPort) {
            replyPort.postMessage(message)

            return
          }

          serviceWorker?.postMessage(message)
        }

        switch (message.type) {
          case "ASK_AUTH": {
            reply(notifyAuthMessage(authStateSignal.value))
            break
          }
          case "REFRESH_AUTH": {
            void (async () => {
              const refreshToken = authStateSignal.value?.refreshToken

              if (!refreshToken) {
                reply(notifyAuthMessage(null))

                return
              }

              try {
                const didRefresh = await refreshAuthSession(refreshToken)

                reply(
                  notifyAuthMessage(didRefresh ? authStateSignal.value : null),
                )
              } catch (error) {
                console.error(error)
                reply(notifyAuthMessage(null))
              }
            })()
            break
          }
          case "ASK_CONFIGURATION": {
            reply(
              configurationChangeMessage({
                API_COUCH_URI: configuration.API_COUCH_URI,
                API_URL: configuration.API_URL,
              }),
            )
            break
          }
        }
      }),
    )
  }

  sendMessage(message: MessageOf<"CONFIGURATION_CHANGE">) {
    if (!("serviceWorker" in navigator)) {
      return EMPTY
    }

    navigator.serviceWorker.controller?.postMessage(message)
  }

  /**
   * Send message to given service worker
   */
  static sendMessage(serviceWorker: ServiceWorker, message: AppMessage) {
    serviceWorker.postMessage(message)
  }
}

export const webCommunication = new WebCommunication()
