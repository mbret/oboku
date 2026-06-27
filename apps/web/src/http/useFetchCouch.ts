import { useMutation } from "@tanstack/react-query"
import { httpClientApi } from "./httpClientApi.web"
import type { FetchConfig } from "./httpClient.shared"

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
    }) => httpClientApi.fetch(input, config),
    gcTime: 0,
    meta: { suppressGlobalErrorToast: true },
  })

export type FetchCouch = ReturnType<typeof useFetchCouch>["mutateAsync"]
