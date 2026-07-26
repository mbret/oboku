import {
  type QueryClient,
  type QueryKey,
  type SkipToken,
  skipToken,
} from "@tanstack/react-query"
import { defer, firstValueFrom, type Observable } from "rxjs"

export type EnsureQueryFn$<TQueryFnData> =
  | SkipToken
  | Observable<TQueryFnData>
  | (() => Observable<TQueryFnData>)

/**
 * Observable flavour of `queryClient.ensureQueryData`: resolves the first
 * available value for the query and seeds the cache with it when the entry
 * was empty. It deliberately bypasses the tanstack fetch machinery so the
 * query's registered `queryFn` is never swapped out from under live
 * `useQuery$` observers of the same key — the trade-off being that retry
 * options do not apply and a concurrent cold call may subscribe the source
 * twice.
 */
export const ensureQueryData$ = async <TQueryFnData>(
  queryClient: QueryClient,
  options: {
    queryKey: QueryKey
    queryFn: EnsureQueryFn$<TQueryFnData>
  },
): Promise<TQueryFnData> => {
  const cachedData = queryClient.getQueryData<TQueryFnData>(options.queryKey)

  if (cachedData !== undefined) return cachedData

  const { queryFn } = options

  if (queryFn === skipToken) {
    throw new Error("ensureQueryData$ requires a queryFn, received skipToken")
  }

  const source$ = defer(function subscribeQuerySource() {
    return typeof queryFn === "function" ? queryFn() : queryFn
  })

  const firstValue = await firstValueFrom(source$)

  const isCacheStillEmpty =
    queryClient.getQueryData(options.queryKey) === undefined

  if (isCacheStillEmpty) {
    queryClient.setQueryData(options.queryKey, firstValue)
  }

  return firstValue
}
