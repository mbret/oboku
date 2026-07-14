import type { AppMessage } from "./types.shared"

export const sendMessageToServiceWorker = (
  serviceWorker: ServiceWorker,
  message: AppMessage,
) => {
  serviceWorker.postMessage(message)
}
