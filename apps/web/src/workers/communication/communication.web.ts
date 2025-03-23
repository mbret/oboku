import { EMPTY, fromEvent, merge, Subject, tap } from "rxjs"
import { getProfile } from "../../profile/currentProfile"
import {
  AskAuthMessage,
  AskProfileMessage,
  ReplyAskProfileMessage,
  ReplyAuthMessage,
  type SkipWaitingMessage,
} from "./types.shared"
import { authStateSignal } from "../../auth/authState"
import { Logger } from "../../debug/logger.shared"

export class WebCommunication {
  private incomingMessageSubject = new Subject<
    AskAuthMessage | AskProfileMessage
  >()

  public incomingMessage$ = this.incomingMessageSubject.asObservable()

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
            const message = new ReplyAuthMessage({
              token: authStateSignal.getValue()?.token,
            })

            this.incomingMessageSubject.next(message)
            navigator.serviceWorker.controller?.postMessage(message)
          }

          if (event.data.type === AskProfileMessage.type) {
            const message = new ReplyAskProfileMessage({
              profile: getProfile(),
            })

            this.incomingMessageSubject.next(message)
            navigator.serviceWorker.controller?.postMessage(message)
          }
        }
      }),
    )
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
