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
