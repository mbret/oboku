import type {
  ConfigurationChangeMessage,
  SkipWaitingMessage,
} from "./types.shared"

export const sendMessageToServiceWorker = (
  serviceWorker: ServiceWorker,
  message: SkipWaitingMessage,
) => {
  serviceWorker.postMessage(message)
}

export const postMessageToController = (
  message: ConfigurationChangeMessage,
) => {
  if (!("serviceWorker" in navigator)) {
    return
  }

  navigator.serviceWorker.controller?.postMessage(message)
}
