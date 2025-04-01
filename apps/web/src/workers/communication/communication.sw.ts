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
  AskConfigurationMessage,
  AskProfileMessage,
  ConfigurationChangeMessage,
  ReplyAskProfileMessage,
  NotifyAuthMessage,
  SkipWaitingMessage,
} from "./types.shared"
import { Logger } from "../../debug/logger.shared"

declare const self: ServiceWorkerGlobalScope

class IncomingMessageTimeoutError extends Error {
  constructor() {
    super("Incoming message timeout")
  }
}

class ServiceWorkerCommunication {
  private incomingMessageSubject = new Subject<
    | NotifyAuthMessage
    | ReplyAskProfileMessage
    | SkipWaitingMessage
    | ConfigurationChangeMessage
  >()

  public incomingMessage$ = this.incomingMessageSubject.asObservable()

  registerMessage = (event: ExtendableMessageEvent) => {
    if (typeof event.data === "object" && "type" in event.data) {
      Logger.log("communication:sw", "received message from client", event.data)

      // @todo make it dynamic

      if (event.data.type === NotifyAuthMessage.type) {
        this.incomingMessageSubject.next(
          new NotifyAuthMessage(event.data.payload),
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

      if (event.data.type === ConfigurationChangeMessage.type) {
        this.incomingMessageSubject.next(
          new ConfigurationChangeMessage(event.data.payload),
        )
      }
    }
  }

  private sendMessage(message: unknown) {
    Logger.log("communication:sw", "sending message", message)

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

  public askAuth() {
    this.sendMessage(new AskAuthMessage())

    return this.waitFor((message) => message instanceof NotifyAuthMessage)
  }

  public askConfig() {
    this.sendMessage(new AskConfigurationMessage())

    return this.waitFor(
      (message) => message instanceof ConfigurationChangeMessage,
    )
  }

  public askProfile() {
    this.sendMessage(new AskProfileMessage())

    return this.waitFor((message) => message instanceof ReplyAskProfileMessage)
  }

  public watch<
    Reply extends
      | typeof SkipWaitingMessage
      | typeof ConfigurationChangeMessage
      | typeof NotifyAuthMessage,
  >(Message: Reply) {
    return this.incomingMessage$.pipe(
      filter(
        (message): message is InstanceType<Reply> => message instanceof Message,
      ),
    )
  }
}

export const serviceWorkerCommunication = new ServiceWorkerCommunication()
