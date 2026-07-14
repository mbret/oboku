import { getCoverIdFromUrl, SW_COVERS_CACHE_KEY } from "./helpers.shared"
import { API_URL } from "../config/envs.shared"
import { HttpClientError } from "../http/httpClient.shared"
import { httpClientApi } from "../http/httpClientApi.sw"

export const coversFetchListener = (event: FetchEvent) => {
  const url = new URL(event.request.url)

  if (
    event.request.destination === "image" &&
    event.request.url.startsWith(`${API_URL}/covers`)
  ) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(SW_COVERS_CACHE_KEY)

        const cachedResponse = await cache.match(event.request)

        if (cachedResponse) {
          return cachedResponse
        }

        /**
         * We want to be able to access the response headers (avoid opaque).
         * So we make sure to have a cors enabled request.
         *
         * `no-store` skips the browser HTTP cache: covers are served with a long
         * `immutable` Cache-Control and this worker keeps its own Cache Storage
         * layer above, so letting the HTTP cache also retain them only pins stale
         * entries — e.g. a response cached under a previous CORS policy that now
         * fails the credentialed CORS check.
         */
        try {
          const { response } = await httpClientApi.fetch(event.request, {
            unwrap: false,
            mode: "cors",
            cache: "no-store",
          })

          if (response.status !== 200) {
            return response
          }

          const clonedResponse = response.clone()

          const coverId = getCoverIdFromUrl(url) ?? `-1`

          cache.put(
            new Request(event.request.url, {
              headers: {
                "oboku-sw-time-cached": Date.now().toString(),
                "oboku-sw-cover-id": coverId,
                "oboku-sw-cover-size":
                  response.headers.get("Content-Length") || "0",
              },
            }),
            clonedResponse,
          )

          return response
        } catch (error) {
          console.error(error)

          // Pass through the original fetch error
          return new Response(null, {
            status: 502, // or whatever status code is appropriate
            statusText:
              error instanceof HttpClientError
                ? error.message
                : "Network error",
          })
        }
      })(),
    )

    return true
  }

  return false
}
