import { type AppMessage, parseMessage } from "./types.shared"
import { Logger } from "../../debug/logger.shared"

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
}

export const serviceWorkerCommunication = new ServiceWorkerCommunication()
