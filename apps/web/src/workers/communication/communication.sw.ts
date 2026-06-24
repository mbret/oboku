import { filter, first, Subject, throwError, timeout } from "rxjs"
import {
  type AppMessage,
  type AppMessageType,
  type MessageOf,
  askAuthMessage,
  askConfigurationMessage,
  askProfileMessage,
  parseMessage,
  refreshAuthMessage,
} from "./types.shared"
import { Logger } from "../../debug/logger.shared"

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

const DEFAULT_CLIENT_REPLY_TIMEOUT_MS = 1000
const REFRESH_AUTH_REPLY_TIMEOUT_MS = 5000

class ServiceWorkerCommunication {
  private incomingMessageSubject = new Subject<AppMessage>()

  /**
   * Validate an inbound `message` event against the contract, fan it out to
   * `watch`/`waitFor` subscribers, and return it so the caller can act on it
   * directly (e.g. wrap a task in `waitUntil`). Unknown/malformed messages are
   * dropped and return `null`.
   */
  registerMessage = (event: ExtendableMessageEvent): AppMessage | null => {
    const message = parseMessage(event.data)

    if (!message) return null

    Logger.log("communication:sw", "received message from client", message)

    this.incomingMessageSubject.next(message)

    return message
  }

  private sendMessage(message: AppMessage) {
    Logger.log("communication:sw", "sending message", message)

    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage(message)
      })
    })
  }

  private waitFor<T extends AppMessageType>(type: T) {
    return this.incomingMessageSubject.pipe(
      filter((message): message is MessageOf<T> => message.type === type),
      timeout({
        each: 1000,
        with: () => throwError(() => new IncomingMessageTimeoutError()),
      }),
      first(),
    )
  }

  private async requestReplyFromClient<T extends AppMessageType>({
    clientId,
    message,
    replyType,
    timeoutMs = DEFAULT_CLIENT_REPLY_TIMEOUT_MS,
  }: {
    clientId: string
    message: AppMessage
    replyType: T
    timeoutMs?: number
  }): Promise<MessageOf<T>> {
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

        const reply = parseMessage(event.data)

        if (reply && reply.type === replyType) {
          resolve(reply as MessageOf<T>)

          return
        }

        reject(new InvalidMessageError(replyType))
      }

      Logger.log("communication:sw", "sending request to client", {
        clientId,
        message,
      })

      client.postMessage(message, [channel.port2])
    })
  }

  public askProfile() {
    this.sendMessage(askProfileMessage())

    return this.waitFor("ReplyAskProfileMessage")
  }

  public async askClientAuth(clientId: string) {
    return await this.requestReplyFromClient({
      clientId,
      message: askAuthMessage(),
      replyType: "NotifyAuthMessage",
    })
  }

  public async refreshClientAuth(clientId: string) {
    return await this.requestReplyFromClient({
      clientId,
      message: refreshAuthMessage(),
      replyType: "NotifyAuthMessage",
      timeoutMs: REFRESH_AUTH_REPLY_TIMEOUT_MS,
    })
  }
}

export const serviceWorkerCommunication = new ServiceWorkerCommunication()
