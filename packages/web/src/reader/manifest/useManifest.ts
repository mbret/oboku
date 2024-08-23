import { Manifest } from "@prose-reader/shared"
import { useQuery } from "reactjrx"
import { webStreamer } from "../streamer/webStreamer"
import { STREAMER_URL_PREFIX } from "../../constants.shared"

const getManifestBaseUrl = (origin: string, epubFileName: string) => {
  return `${origin}/${STREAMER_URL_PREFIX}/${epubFileName}/`
}

export const useManifest = (bookId: string | undefined) => {
  return useQuery({
    queryKey: ["reader/streamer/manifest", { bookId }],
    queryFn: async () => {
      const response = await fetch(
        `${window.location.origin}/streamer/${bookId}/manifest`
      )

      if (response.status === 415) {
        const rarResponse = await webStreamer.fetchManifest({
          key: bookId ?? ``,
          baseUrl: getManifestBaseUrl(window.location.origin, bookId ?? "")
        })

        return {
          manifest: await rarResponse.json(),
          isRar: true
        }
      }

      const data: Manifest = await response.json()

      return { manifest: data, isRar: false }
    },
    staleTime: Infinity,
    retry: (_, error) => !(error instanceof Response && error.status === 415),
    enabled: !!bookId
  })
}
