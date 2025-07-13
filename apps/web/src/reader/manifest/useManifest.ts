import type { Manifest } from "@prose-reader/shared"
import { webStreamer } from "../streamer/webStreamer"
import { STREAMER_URL_PREFIX } from "../../workers/constants.shared"
import { serviceWorkerReadySignal } from "../../workers/states.web"
import { useQuery } from "@tanstack/react-query"
import { useDatabase } from "../../rxdb"
import { getMetadataFromBook } from "../../books/metadata"
import { httpClient } from "../../http/httpClient.shared"

const getManifestBaseUrl = (origin: string, epubFileName: string) => {
  return `${origin}/${STREAMER_URL_PREFIX}/${epubFileName}/`
}

export const useManifest = (bookId: string | undefined) => {
  const { db } = useDatabase()

  return useQuery({
    queryKey: ["reader/streamer/manifest", { bookId }],
    queryFn: async () => {
      const { response: swStreamerResponse } =
        serviceWorkerReadySignal.getValue()
          ? await httpClient.fetch(
              `${window.location.origin}/streamer/${bookId}/manifest`,
              {
                validateStatus: () => true,
              },
            )
          : { response: undefined }

      const enrichManifest = async (_manifest: Manifest) => {
        const book = await db?.book.findOne(bookId).exec()
        const metadata = getMetadataFromBook(book)

        return {
          ..._manifest,
          title: metadata.title?.toString() ?? _manifest.title,
        } satisfies Manifest
      }

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
          baseUrl: getManifestBaseUrl(window.location.origin, bookId ?? ""),
        })

        if (webStreamerResponse.status >= 400) {
          throw webStreamerResponse
        }

        return {
          manifest: await enrichManifest(await webStreamerResponse.json()),
          isUsingWebStreamer: true,
        }
      }

      const data: Manifest = await swStreamerResponse.json()

      return { manifest: await enrichManifest(data), isUsingWebStreamer: false }
    },
    staleTime: Infinity,
    retry: (_, error) => !(error instanceof Response && error.status === 415),
    enabled: !!bookId && !!db,
  })
}
