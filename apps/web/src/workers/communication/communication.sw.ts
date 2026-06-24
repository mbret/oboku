import {
  type AppMessage,
  type AppMessageType,
  type MessageOf,
  askAuthMessage,
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
  /**
   * Validate an inbound `message` event against the contract and return it so
   * the caller can act on it directly (e.g. wrap a task in `waitUntil`).
   * Unknown/malformed messages are dropped and return `null`.
   */
  registerMessage = (event: ExtendableMessageEvent): AppMessage | null => {
    const message = parseMessage(event.data)

    if (!message) return null

    Logger.log("communication:sw", "received message from client", message)

    return message
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
