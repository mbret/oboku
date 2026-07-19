import type {
  DefaultError,
  Query,
  QueryKey,
  UseQueryOptions,
} from "@tanstack/react-query"
import { getActiveProfileId } from "../profiles/active/activeProfileId"
import { useIsAuthenticated } from "./useIsAuthenticated"

type CallerEnabled<
  TQueryFnData,
  TError,
  TQueryKey extends QueryKey,
> = UseQueryOptions<TQueryFnData, TError, TQueryFnData, TQueryKey>["enabled"]

const resolveCallerEnabled = <TQueryFnData, TError, TQueryKey extends QueryKey>(
  enabled: CallerEnabled<TQueryFnData, TError, TQueryKey>,
  query: Query<TQueryFnData, TError, TQueryFnData, TQueryKey>,
) => (typeof enabled === "function" ? enabled(query) : (enabled ?? true))

/**
 * Wraps the options of a query that requires an authenticated session.
 *
 * A render-derived `enabled: isAuthenticated` is not enough on its own:
 * sign-out clears the session and runs `resetSessionQueries` in the same
 * tick, and the refetch of active queries it triggers reads `enabled` from
 * the observer's **last render** — still `true` — so the request would fire
 * without credentials and 401. Resolving `enabled` as a function checks the
 * live session at fetch-decision time instead, on top of whatever
 * `enabled` the caller provides.
 *
 * The live check is not reactive (nothing re-renders when it flips),
 * so query hooks should use `useQueryOptionsWithAuthentication`, which adds
 * the reactive `isAuthenticated` watch.
 */
export const withQueryOptionsAuthentication = <
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
): UseQueryOptions<TQueryFnData, TError, TData, TQueryKey> => {
  const { enabled: callerEnabled } = options

  return {
    ...options,
    enabled: function enabledWhileSessionIsActive(query) {
      return (
        !!getActiveProfileId() && resolveCallerEnabled(callerEnabled, query)
      )
    },
  }
}

/**
 * `withQueryOptionsAuthentication` plus the reactive counterpart: subscribes
 * to the auth state so the observer re-renders (and starts/stops fetching)
 * when the session appears, drops, or needs relogin.
 */
export const useQueryOptionsWithAuthentication = <
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
): UseQueryOptions<TQueryFnData, TError, TData, TQueryKey> => {
  const isAuthenticated = useIsAuthenticated()
  const { enabled: callerEnabled } = options

  return withQueryOptionsAuthentication({
    ...options,
    enabled: function enabledWhileAuthenticated(query) {
      return isAuthenticated && resolveCallerEnabled(callerEnabled, query)
    },
  })
}
