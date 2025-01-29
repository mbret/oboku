import { Manifest } from "@prose-reader/shared"
import { webStreamer } from "../streamer/webStreamer"
import { STREAMER_URL_PREFIX } from "../../constants.shared"
import { serviceWorkerReadySignal } from "../../workers/states"
import { useQuery } from "@tanstack/react-query"

const getManifestBaseUrl = (origin: string, epubFileName: string) => {
  return `${origin}/${STREAMER_URL_PREFIX}/${epubFileName}/`
}

export const useManifest = (bookId: string | undefined) => {
  return useQuery({
    queryKey: ["reader/streamer/manifest", { bookId }],
    queryFn: async () => {
      const swStreamerResponse = serviceWorkerReadySignal.getValue()
        ? await fetch(`${window.location.origin}/streamer/${bookId}/manifest`)
        : undefined

      if (
        !swStreamerResponse ||
        swStreamerResponse.status === 415 ||
        /**
         * Most likely service worker is not registered.
         * Can happens on firefox during development
         */
        swStreamerResponse.headers.get("Content-Type") === "text/html"
      ) {
        const webStreamerResponse = await webStreamer.fetchManifest({
          key: bookId ?? ``,
          baseUrl: getManifestBaseUrl(window.location.origin, bookId ?? "")
        })

        if (webStreamerResponse.status >= 400) {
          throw webStreamerResponse
        }

        return {
          manifest: await webStreamerResponse.json(),
          isUsingWebStreamer: true
        }
      }

      const data: Manifest = await swStreamerResponse.json()

      return { manifest: data, isUsingWebStreamer: false }
    },
    staleTime: Infinity,
    retry: (_, error) => !(error instanceof Response && error.status === 415),
    enabled: !!bookId
  })
}
