import { useQueryClient } from "@tanstack/react-query"
import { useCallback } from "react"
import { refreshOnUnauthorized } from "./httpClientApi.web"
import { type FetchConfig, HttpClient } from "./httpClient.shared"
import { injectToken } from "./injectToken.web"

class HttpCouchClient extends HttpClient {}

const httpCouchClient = new HttpCouchClient()

// biome-ignore lint/correctness/useHookAtTopLevel: Not a hook
httpCouchClient.useRequestInterceptor(injectToken)

// biome-ignore lint/correctness/useHookAtTopLevel: Not a hook
httpCouchClient.useResponseInterceptor(refreshOnUnauthorized)

let couchFetchRequestId = 0

/**
 * Routes every CouchDB replication request through the React Query client via
 * `fetchQuery`, so replication traffic participates in the same query process
 * (in-flight tracking, devtools, error surfacing) as the rest of the app
 * instead of bypassing it through a module-level client singleton.
 *
 * Each call gets a unique query key with caching disabled (`staleTime`/`gcTime`
 * at 0): replication requests are one-shot, carry distinct bodies, and their
 * `Response` body can only be read once, so any cache reuse would be incorrect.
 * Retries are left to RxDB's replication engine, not React Query.
 */
export const useFetchCouch = () => {
  const queryClient = useQueryClient()

  return useCallback(
    (
      input: string | URL | globalThis.Request,
      config: Omit<FetchConfig, "input"> = {},
    ) => {
      couchFetchRequestId += 1

      return queryClient.fetchQuery({
        queryKey: ["couch", "fetch", couchFetchRequestId],
        queryFn: () => httpCouchClient.fetch(input, config),
        staleTime: 0,
        gcTime: 0,
        retry: false,
      })
    },
    [queryClient],
  )
}

export type FetchCouch = ReturnType<typeof useFetchCouch>
