import { EMPTY, fromEvent, merge, tap } from "rxjs"
import { getProfile } from "../../profile/currentProfile"
import {
  AskAuthMessage,
  AskConfigurationMessage,
  AskProfileMessage,
  ConfigurationChangeMessage,
  ReplyAskProfileMessage,
  NotifyAuthMessage,
  type SkipWaitingMessage,
} from "./types.shared"
import { authStateSignal } from "../../auth/states.web"
import { Logger } from "../../debug/logger.shared"
import { configuration } from "../../config/configuration"

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
        if (
          "data" in event &&
          typeof event.data === "object" &&
          event.data &&
          "type" in event.data
        ) {
          Logger.log(
            ["communication:web"],
            "received message from service worker",
            event.data,
          )

          if (event.data.type === AskAuthMessage.type) {
            const message = new NotifyAuthMessage(authStateSignal.value)

            navigator.serviceWorker.controller?.postMessage(message)
          }

          if (event.data.type === AskProfileMessage.type) {
            const message = new ReplyAskProfileMessage({
              profile: getProfile(),
            })

            navigator.serviceWorker.controller?.postMessage(message)
          }

          if (event.data.type === AskConfigurationMessage.type) {
            const message = new ConfigurationChangeMessage({
              API_COUCH_URI: configuration.API_COUCH_URI,
              API_URL: configuration.API_URL,
            })

            navigator.serviceWorker.controller?.postMessage(message)
          }
        }
      }),
    )
  }

  sendMessage(message: ConfigurationChangeMessage | NotifyAuthMessage) {
    if (!("serviceWorker" in navigator)) {
      return EMPTY
    }

    navigator.serviceWorker.controller?.postMessage(message)
  }

  /**
   * Send message to given service worker
   */
  static sendMessage(
    serviceWorker: ServiceWorker,
    message: SkipWaitingMessage,
  ) {
    serviceWorker.postMessage(message)
  }
}

export const webCommunication = new WebCommunication()
