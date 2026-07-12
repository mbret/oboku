import {
  type DefaultError,
  type UseMutationOptions,
  useMutation,
} from "@tanstack/react-query"
import { useHttpClientApi } from "."
import type { FetchConfig, HttpClientResponse } from "./httpClient.shared"

type FetchInput = string | URL | globalThis.Request
type FetchOptions = Omit<FetchConfig, "input">
type FetchVariables = { input: FetchInput; config: FetchOptions }

export const useFetchCouch = (
  options?: Pick<
    UseMutationOptions<
      HttpClientResponse<unknown>,
      DefaultError,
      FetchVariables
    >,
    "meta"
  >,
) => {
  const httpClientApi = useHttpClientApi()

  return useMutation({
    ...options,
    mutationFn: ({ input, config }: FetchVariables) =>
      httpClientApi.fetch(input, config),
    gcTime: 0,
  })
}

export type FetchCouch = ReturnType<typeof useFetchCouch>["mutateAsync"]
