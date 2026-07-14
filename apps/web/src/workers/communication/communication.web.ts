import type { AppMessage } from "./types.shared"

/**
 * Send message to given service worker
 */
export const sendMessageToServiceWorker = (
  serviceWorker: ServiceWorker,
  message: AppMessage,
) => {
  serviceWorker.postMessage(message)
}
