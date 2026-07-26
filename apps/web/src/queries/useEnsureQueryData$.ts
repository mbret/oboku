import {
  type QueryKey,
  skipToken,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { type EnsureQueryFn$, ensureQueryData$ } from "./ensureQueryData$"

const ENSURE_QUERY_KEY_PREFIX = "ensureQueryData$"

/**
 * Resolves the first available result (or error) of a query through
 * `ensureQueryData$` and never updates afterwards, even while other
 * observers keep the query cache live. The snapshot is memoized under a
 * private `[ENSURE_QUERY_KEY_PREFIX, queryKey]` cache entry scoped to the
 * consumers' lifetime, so concurrent consumers share one resolution and a
 * key change resolves a fresh one. Gate resolution with a `skipToken`
 * queryFn.
 *
 * The freeze assumes invalidations stay prefix-scoped (the app norm): an
 * unfiltered `invalidateQueries`/`resetQueries` sweep bypasses `staleTime`
 * and would re-resolve the snapshot.
 */
export function useEnsureQueryData$<
  TQueryFnData = unknown,
  TQueryKey extends QueryKey = QueryKey,
>(options: {
  queryKey: TQueryKey
  queryFn: EnsureQueryFn$<TQueryFnData>
}): { data: TQueryFnData | undefined; error: unknown } {
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: [ENSURE_QUERY_KEY_PREFIX, options.queryKey],
    queryFn:
      options.queryFn === skipToken
        ? skipToken
        : function resolveFirstResult() {
            return ensureQueryData$(queryClient, options)
          },
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: 0,
    retry: false,
  })
}
