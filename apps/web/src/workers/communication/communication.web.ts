import { EMPTY, fromEvent, merge, tap } from "rxjs"
import { getProfile } from "../../profile/currentProfile"
import {
  AskAuthMessage,
  AskConfigurationMessage,
  AskProfileMessage,
  ConfigurationChangeMessage,
  RefreshAuthMessage,
  ReplyAskProfileMessage,
  NotifyAuthMessage,
  type SkipWaitingMessage,
} from "./types.shared"
import { authStateSignal } from "../../auth/states.web"
import { Logger } from "../../debug/logger.shared"
import { configuration } from "../../config/configuration"
import { refreshAuthSession } from "../../http/httpClientApi.web"

const isWorkerMessage = (
  message: unknown,
): message is {
  type: string
  payload?: unknown
} => typeof message === "object" && message !== null && "type" in message

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
        const data = "data" in event ? event.data : undefined

        if (isWorkerMessage(data)) {
          const replyPort =
            event instanceof MessageEvent ? event.ports[0] : undefined
          const serviceWorker =
            event instanceof MessageEvent
              ? event.source
              : navigator.serviceWorker.controller

          Logger.log(
            ["communication:web"],
            "received message from service worker",
            data,
          )

          const reply = (
            message:
              | ConfigurationChangeMessage
              | NotifyAuthMessage
              | ReplyAskProfileMessage,
          ) => {
            if (replyPort) {
              replyPort.postMessage(message)

              return
            }

            serviceWorker?.postMessage(message)
          }

          if (data.type === AskAuthMessage.type) {
            reply(new NotifyAuthMessage(authStateSignal.value))
          }

          if (data.type === RefreshAuthMessage.type) {
            void (async () => {
              const refreshToken = authStateSignal.value?.refreshToken

              if (!refreshToken) {
                reply(new NotifyAuthMessage(null))

                return
              }

              try {
                const didRefresh = await refreshAuthSession(refreshToken)

                reply(
                  new NotifyAuthMessage(
                    didRefresh ? authStateSignal.value : null,
                  ),
                )
              } catch (error) {
                console.error(error)
                reply(new NotifyAuthMessage(null))
              }
            })()
          }

          if (data.type === AskProfileMessage.type) {
            const message = new ReplyAskProfileMessage({
              profile: getProfile(),
            })

            reply(message)
          }

          if (data.type === AskConfigurationMessage.type) {
            const message = new ConfigurationChangeMessage({
              API_COUCH_URI: configuration.API_COUCH_URI,
              API_URL: configuration.API_URL,
            })

            reply(message)
          }
        }
      }),
    )
  }

  sendMessage(message: ConfigurationChangeMessage) {
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
