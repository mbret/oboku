import {
  hashKey,
  type QueryKey,
  skipToken,
  useQueryClient,
} from "@tanstack/react-query"
import { useEffect, useRef, useState } from "react"
import { type EnsureQueryFn$, ensureQueryData$ } from "./ensureQueryData$"

type FirstResult<TQueryFnData> = {
  queryHash: string
  data: TQueryFnData | undefined
  error: unknown
}

const noResultYet = { data: undefined, error: undefined }

/**
 * Resolves the first available result (or error) of a query through
 * `ensureQueryData$` and never updates afterwards, even while other
 * observers keep the query cache live. The snapshot is keyed by the query
 * key, so a key change resolves a fresh one. Gate resolution with a
 * `skipToken` queryFn.
 */
export function useEnsureQueryData$<
  TQueryFnData = unknown,
  TQueryKey extends QueryKey = QueryKey,
>(options: {
  queryKey: TQueryKey
  queryFn: EnsureQueryFn$<TQueryFnData>
}): { data: TQueryFnData | undefined; error: unknown } {
  const queryClient = useQueryClient()
  const queryHash = hashKey(options.queryKey)
  const [firstResult, setFirstResult] = useState<FirstResult<TQueryFnData>>()
  const optionsRef = useRef(options)
  optionsRef.current = options

  useEffect(
    function resolveFirstResult() {
      if (optionsRef.current.queryFn === skipToken) return

      let isDisposed = false

      const captureFirstResult = (
        result: Pick<FirstResult<TQueryFnData>, "data" | "error">,
      ) => {
        if (isDisposed) return

        setFirstResult((existing) =>
          existing?.queryHash === queryHash
            ? existing
            : { queryHash, ...result },
        )
      }

      ensureQueryData$(queryClient, optionsRef.current)
        .then((data) => captureFirstResult({ data, error: undefined }))
        .catch((error) => captureFirstResult({ data: undefined, error }))

      return function disposeCapture() {
        isDisposed = true
      }
    },
    [queryHash, queryClient],
  )

  return firstResult?.queryHash === queryHash ? firstResult : noResultYet
}
