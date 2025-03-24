import { firstValueFrom } from "rxjs"
import { getCoverIdFromUrl } from "./helpers.shared"
import { serviceWorkerCommunication } from "../workers/communication/communication.sw"
import { serviceWorkerConfiguration } from "../config/configuration.sw"

export const coversFetchListener = (event: FetchEvent) => {
  const url = new URL(event.request.url)

  if (
    event.request.destination === "image" &&
    event.request.url.startsWith(`${serviceWorkerConfiguration.API_URL}/covers`)
  ) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(
          serviceWorkerConfiguration.SW_COVERS_CACHE_KEY,
        )

        const cachedResponse = await cache.match(event.request)

        if (cachedResponse) {
          return cachedResponse
        }

        const auth = await firstValueFrom(serviceWorkerCommunication.askAuth())

        /**
         * We want to be able to access the response headers (avoid opaque).
         * So we make sure to have a cors enabled request.
         */
        try {
          const response = await fetch(event.request, {
            mode: "cors",
            credentials: "omit",
            headers: {
              authorization: `Bearer ${auth.payload.token}`,
            },
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
              error instanceof Error ? error.message : "Network error",
          })
        }
      })(),
    )

    return true
  }

  return false
}
