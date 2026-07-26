import {
  type DefaultError,
  hashKey,
  type QueryKey,
  type UseQueryOptions,
} from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { useQuery$ } from "reactjrx"

type ObservableQueryFn<
  TQueryFnData,
  TError,
  TQueryKey extends QueryKey,
> = Parameters<
  typeof useQuery$<TQueryFnData, TError, TQueryFnData, TQueryKey>
>[0]["queryFn"]

type FirstResult<TQueryFnData, TError> = {
  queryHash: string
  data: TQueryFnData | undefined
  error: TError | undefined
}

const noResultYet = { data: undefined, error: undefined }

/**
 * Resolves the first available result (or error) of a query and never
 * updates afterwards, even while other observers keep the query cache live.
 * The snapshot is keyed by the query key, so a key change resolves a fresh
 * one. Gate resolution with a `skipToken` queryFn; `enabled` is reserved by
 * the hook itself.
 */
export function useEnsureQueryData$<
  TQueryFnData = unknown,
  TError = DefaultError,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: Omit<
    UseQueryOptions<TQueryFnData, TError, TQueryFnData, TQueryKey>,
    "queryFn" | "enabled" | "select"
  > & {
    queryFn: ObservableQueryFn<TQueryFnData, TError, TQueryKey>
  },
): { data: TQueryFnData | undefined; error: TError | undefined } {
  const queryHash = hashKey(options.queryKey)
  const [firstResult, setFirstResult] =
    useState<FirstResult<TQueryFnData, TError>>()

  const { data, error } = useQuery$<
    TQueryFnData,
    TError,
    TQueryFnData,
    TQueryKey
  >({
    ...options,
    enabled: function observeUntilFirstResult(query) {
      return query.state.data === undefined
    },
  })

  useEffect(
    function captureFirstResult() {
      const hasNoResultYet = data === undefined && error === null

      if (hasNoResultYet) return

      setFirstResult((existing) =>
        existing?.queryHash === queryHash
          ? existing
          : { queryHash, data, error: error ?? undefined },
      )
    },
    [data, error, queryHash],
  )

  return firstResult?.queryHash === queryHash ? firstResult : noResultYet
}
