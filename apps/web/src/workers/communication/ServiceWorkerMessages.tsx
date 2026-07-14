import { memo, useEffect } from "react"
import { fromEvent } from "rxjs"
import { getProfile } from "../../profiles"
import {
  AskConfigurationMessage,
  AskProfileMessage,
  ConfigurationChangeMessage,
  ReplyAskProfileMessage,
} from "./types.shared"
import { Logger } from "../../debug/logger.shared"
import { API_COUCH_URI, API_URL } from "../../config/envs"

const isWorkerMessage = (
  message: unknown,
): message is {
  type: string
  payload?: unknown
} => typeof message === "object" && message !== null && "type" in message

export const ServiceWorkerMessages = memo(function ServiceWorkerMessages() {
  useEffect(function listenIncomingServiceWorkerMessages() {
    if (!("serviceWorker" in navigator)) {
      return
    }

    const subscription = fromEvent(
      navigator.serviceWorker,
      "message",
    ).subscribe((event) => {
      const data = "data" in event ? event.data : undefined

      if (!isWorkerMessage(data)) {
        return
      }

      const replyPort =
        event instanceof MessageEvent ? event.ports[0] : undefined
      const serviceWorker =
        event instanceof MessageEvent
          ? event.source
          : navigator.serviceWorker.controller

      Logger.log(
        ["communication:web"],
        "received message from service worker",
        data,
      )

      const reply = (
        message: ConfigurationChangeMessage | ReplyAskProfileMessage,
      ) => {
        if (replyPort) {
          replyPort.postMessage(message)

          return
        }

        serviceWorker?.postMessage(message)
      }

      if (data.type === AskProfileMessage.type) {
        reply(new ReplyAskProfileMessage({ profile: getProfile() }))
      }

      if (data.type === AskConfigurationMessage.type) {
        reply(new ConfigurationChangeMessage({ API_COUCH_URI, API_URL }))
      }
    })

    return function stopListeningIncomingServiceWorkerMessages() {
      subscription.unsubscribe()
    }
  }, [])

  return null
})
