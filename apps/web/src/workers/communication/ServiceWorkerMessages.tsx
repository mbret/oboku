import { memo, useEffect } from "react"
import { fromEvent } from "rxjs"
import {
  activeProfileIdSignal,
  ensureActiveProfile,
  getProfile,
} from "../../profiles"
import {
  AskAuthMessage,
  AskConfigurationMessage,
  AskProfileMessage,
  ConfigurationChangeMessage,
  NotifyAuthMessage,
  RefreshAuthMessage,
  ReplyAskProfileMessage,
} from "./types.shared"
import { useQueryClient } from "@tanstack/react-query"
import { Logger } from "../../debug/logger.shared"
import { API_COUCH_URI, API_URL } from "../../config/envs"
import { useHttpClientApi } from "../../http"

const isWorkerMessage = (
  message: unknown,
): message is {
  type: string
  payload?: unknown
} => typeof message === "object" && message !== null && "type" in message

export const ServiceWorkerMessages = memo(function ServiceWorkerMessages() {
  const httpClientApi = useHttpClientApi()
  const queryClient = useQueryClient()

  useEffect(
    function listenIncomingServiceWorkerMessages() {
      if (!("serviceWorker" in navigator)) {
        return
      }

      const readSession = () =>
        ensureActiveProfile(queryClient, activeProfileIdSignal.getValue())

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
          message:
            | ConfigurationChangeMessage
            | NotifyAuthMessage
            | ReplyAskProfileMessage,
        ) => {
          if (replyPort) {
            replyPort.postMessage(message)

            return
          }

          serviceWorker?.postMessage(message)
        }

        if (data.type === AskAuthMessage.type) {
          void (async () => {
            try {
              reply(new NotifyAuthMessage(await readSession()))
            } catch (error) {
              console.error(error)
              reply(new NotifyAuthMessage(null))
            }
          })()
        }

        if (data.type === RefreshAuthMessage.type) {
          void (async () => {
            try {
              const refreshToken = (await readSession())?.refreshToken

              if (!refreshToken) {
                reply(new NotifyAuthMessage(null))

                return
              }

              const didRefresh =
                await httpClientApi.refreshAuthSession(refreshToken)

              reply(
                new NotifyAuthMessage(didRefresh ? await readSession() : null),
              )
            } catch (error) {
              console.error(error)
              reply(new NotifyAuthMessage(null))
            }
          })()
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
    },
    [httpClientApi, queryClient],
  )

  return null
})
