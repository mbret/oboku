import { API_URL } from "../constants.shared"
import { COVERS_CACHE_KEY } from "./constants.sw"
import { getCoverIdFromUrl } from "./helpers.shared"

export const coversFetchListener = (event: FetchEvent) => {
  const url = new URL(event.request.url)

  if (
    event.request.destination === "image" &&
    event.request.url.startsWith(`${API_URL}/covers`)
  ) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(COVERS_CACHE_KEY)

        const cachedResponse = await cache.match(event.request)

        if (cachedResponse) {
          return cachedResponse
        }

        /**
         * We want to be able to access the response headers (avoid opaque).
         * So we make sure to have a cors enabled request.
         */
        const response = await fetch(event.request, {
          mode: "cors",
          credentials: "omit"
        })
        const clonedResponse = response.clone()

        const coverId = getCoverIdFromUrl(url) ?? `-1`

        cache.put(
          new Request(event.request.url, {
            headers: {
              "oboku-sw-time-cached": Date.now().toString(),
              "oboku-sw-cover-id": coverId,
              "oboku-sw-cover-size":
                response.headers.get("Content-Length") || "0"
            }
          }),
          clonedResponse
        )

        return response
      })()
    )

    return true
  }

  return false
}
