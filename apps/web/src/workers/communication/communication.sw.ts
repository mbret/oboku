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
  RefreshAuthMessage,
  ReplyAskProfileMessage,
  NotifyAuthMessage,
  SkipWaitingMessage,
} from "./types.shared"
import { Logger } from "../../debug/logger.shared"
import type { AuthSession } from "../../auth/types"

declare const self: ServiceWorkerGlobalScope

export class IncomingMessageTimeoutError extends Error {
  constructor() {
    super("Incoming message timeout")
  }
}

export class InvalidMessageError extends Error {
  constructor(messageType: string) {
    super(`Invalid message for type ${messageType}`)
  }
}

export class ClientNotFoundError extends Error {
  constructor(clientId: string) {
    super(`Unable to find client ${clientId}`)
  }
}

const isMessageData = (
  value: unknown,
): value is {
  type: string
  payload?: unknown
} => typeof value === "object" && value !== null && "type" in value

type ClientReplyMessage =
  | {
      readonly type: typeof NotifyAuthMessage.type
      validate(payload: unknown): payload is AuthSession | null
    }
  | {
      readonly type: typeof ReplyAskProfileMessage.type
      validate(payload: unknown): payload is { profile: string | undefined }
    }
  | {
      readonly type: typeof ConfigurationChangeMessage.type
      validate(
        payload: unknown,
      ): payload is ConfigurationChangeMessage["payload"]
    }

type ClientReplyData<ReplyType extends ClientReplyMessage["type"], Payload> = {
  type: ReplyType
  payload: Payload
}

const DEFAULT_CLIENT_REPLY_TIMEOUT_MS = 1000
const REFRESH_AUTH_REPLY_TIMEOUT_MS = 5000

class ServiceWorkerCommunication {
  private incomingMessageSubject = new Subject<
    ReplyAskProfileMessage | SkipWaitingMessage | ConfigurationChangeMessage
  >()

  public incomingMessage$ = this.incomingMessageSubject.asObservable()

  registerMessage = (event: ExtendableMessageEvent) => {
    if (typeof event.data === "object" && "type" in event.data) {
      Logger.log("communication:sw", "received message from client", event.data)

      // @todo make it dynamic

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

  private async requestReplyFromClient<
    ReplyType extends ClientReplyMessage["type"],
    Payload,
  >({
    clientId,
    message,
    ReplyMessage,
    timeoutMs = DEFAULT_CLIENT_REPLY_TIMEOUT_MS,
  }: {
    clientId: string
    message: unknown
    ReplyMessage: {
      readonly type: ReplyType
      validate(payload: unknown): payload is Payload
    }
    timeoutMs?: number
  }): Promise<ClientReplyData<ReplyType, Payload>> {
    const client = await self.clients.get(clientId)

    if (!client) {
      throw new ClientNotFoundError(clientId)
    }

    return new Promise((resolve, reject) => {
      const channel = new MessageChannel()
      const cleanup = () => {
        clearTimeout(timeoutId)
        channel.port1.close()
      }
      const timeoutId = setTimeout(() => {
        cleanup()
        reject(new IncomingMessageTimeoutError())
      }, timeoutMs)

      channel.port1.onmessage = (event) => {
        cleanup()

        if (
          isMessageData(event.data) &&
          event.data.type === ReplyMessage.type &&
          ReplyMessage.validate(event.data.payload)
        ) {
          resolve({
            type: ReplyMessage.type,
            payload: event.data.payload,
          })

          return
        }

        reject(new InvalidMessageError(ReplyMessage.type))
      }

      Logger.log("communication:sw", "sending request to client", {
        clientId,
        message,
      })

      client.postMessage(message, [channel.port2])
    })
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

  public async askClientAuth(clientId: string) {
    return await this.requestReplyFromClient({
      clientId,
      message: new AskAuthMessage(),
      ReplyMessage: NotifyAuthMessage,
    })
  }

  public async refreshClientAuth(clientId: string) {
    return await this.requestReplyFromClient({
      clientId,
      message: new RefreshAuthMessage(),
      ReplyMessage: NotifyAuthMessage,
      timeoutMs: REFRESH_AUTH_REPLY_TIMEOUT_MS,
    })
  }

  public watch<
    Reply extends typeof SkipWaitingMessage | typeof ConfigurationChangeMessage,
  >(Message: Reply) {
    return this.incomingMessage$.pipe(
      filter(
        (message): message is InstanceType<Reply> => message instanceof Message,
      ),
    )
  }
}

export const serviceWorkerCommunication = new ServiceWorkerCommunication()
