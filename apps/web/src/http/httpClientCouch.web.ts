import { useMutation } from "@tanstack/react-query"
import { refreshOnUnauthorized } from "./httpClientApi.web"
import { type FetchConfig, HttpClient } from "./httpClient.shared"
import { injectToken } from "./injectToken.web"

class HttpCouchClient extends HttpClient {}

const httpCouchClient = new HttpCouchClient()

// biome-ignore lint/correctness/useHookAtTopLevel: Not a hook
httpCouchClient.useRequestInterceptor(injectToken)

// biome-ignore lint/correctness/useHookAtTopLevel: Not a hook
httpCouchClient.useResponseInterceptor(refreshOnUnauthorized)

type FetchInput = string | URL | globalThis.Request
type FetchOptions = Omit<FetchConfig, "input">

export const useFetchCouch = () =>
  useMutation({
    mutationFn: ({
      input,
      config,
    }: {
      input: FetchInput
      config: FetchOptions
    }) => httpCouchClient.fetch(input, config),
    gcTime: 0,
    meta: { suppressGlobalErrorToast: true },
  })

export type FetchCouch = ReturnType<typeof useFetchCouch>["mutateAsync"]
