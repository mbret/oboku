import {
  filter,
  first,
  type ObservedValueOf,
  Subject,
  throwError,
  timeout,
} from "rxjs"
import {
  AskAuthMessage,
  AskProfileMessage,
  ReplyAskProfileMessage,
  ReplyAuthMessage,
  SkipWaitingMessage,
} from "./types.shared"
import { Logger } from "../../debug/logger.shared"

declare const self: ServiceWorkerGlobalScope

class IncomingMessageTimeoutError extends Error {}

class ServiceWorkerCommunication {
  private incomingMessageSubject = new Subject<
    ReplyAuthMessage | ReplyAskProfileMessage | SkipWaitingMessage
  >()

  public incomingMessage$ = this.incomingMessageSubject.asObservable()

  registerMessage = (event: ExtendableMessageEvent) => {
    if (typeof event.data === "object" && "type" in event.data) {
      Logger.log(
        ["communication:sw"],
        "received message from service worker",
        event.data,
      )

      if (event.data.type === ReplyAuthMessage.type) {
        this.incomingMessageSubject.next(
          new ReplyAuthMessage(event.data.payload),
        )
      }

      if (event.data.type === ReplyAskProfileMessage.type) {
        this.incomingMessageSubject.next(
          new ReplyAskProfileMessage(event.data.payload),
        )
      }

      if (event.data.type === SkipWaitingMessage.type) {
        this.incomingMessageSubject.next(new SkipWaitingMessage())
      }
    }
  }

  private sendMessage(message: unknown) {
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage(message)
      })
    })
  }

  private waitFor<
    Reply extends ObservedValueOf<typeof this.incomingMessageSubject>,
  >(
    predicate: (
      value: ObservedValueOf<typeof this.incomingMessageSubject>,
    ) => value is Reply,
  ) {
    return this.incomingMessageSubject.pipe(
      filter(predicate),
      timeout({
        each: 1000,
        with: () => throwError(() => new IncomingMessageTimeoutError()),
      }),
      first(),
    )
  }

  public askConfig() {
    this.sendMessage(new AskAuthMessage())

    return this.waitFor((message) => message instanceof ReplyAuthMessage)
  }

  public askProfile() {
    this.sendMessage(new AskProfileMessage())

    return this.waitFor((message) => message instanceof ReplyAskProfileMessage)
  }

  public watch(Message: typeof SkipWaitingMessage) {
    return this.incomingMessage$.pipe(
      filter((message) => message instanceof Message),
    )
  }
}

export const serviceWorkerCommunication = new ServiceWorkerCommunication()
