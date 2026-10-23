import type {
  DefaultError,
  Query,
  QueryKey,
  UseQueryOptions,
} from "@tanstack/react-query"
import {
  getActiveProfileId,
  useActiveProfileId,
} from "../profiles/active/activeProfileId"
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
 * Wraps the options of a query that requires an authenticated session, so it
 * fetches only while `authenticatedProfileId` is the active profile. Pass the
 * account the observer rendered for, or `undefined` when it rendered without
 * an authenticated session.
 *
 * A render-derived `enabled: isAuthenticated` is not enough on its own:
 * sign-out clears the session and runs `resetSessionQueries` in the same
 * tick, and the refetch of active queries it triggers reads `enabled` from
 * the observer's **last render** — still `true` — so the request would fire
 * without credentials and 401. Resolving `enabled` as a function checks the
 * live session at fetch-decision time instead, on top of whatever
 * `enabled` the caller provides.
 *
 * Once another account is active, an observer rendered for
 * `authenticatedProfileId` stops fetching, even before it re-renders: the
 * request would carry the other account's cookies and cache its data under
 * this account's key. TanStack Query does not read `enabled` for a manual
 * `refetch()`, or for an interval tick scheduled before the change.
 *
 * The live check is not reactive (nothing re-renders when it flips),
 * so query hooks should use `useQueryOptionsWithAuthentication`, which
 * supplies the account from the auth state.
 */
export const withQueryOptionsAuthentication = <
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  authenticatedProfileId: string | undefined,
): UseQueryOptions<TQueryFnData, TError, TData, TQueryKey> => {
  const { enabled: callerEnabled } = options

  return {
    ...options,
    enabled: function enabledWhileSessionIsActive(query) {
      const isAuthenticatedProfileActive =
        !!authenticatedProfileId &&
        authenticatedProfileId === getActiveProfileId()

      return (
        isAuthenticatedProfileActive &&
        resolveCallerEnabled(callerEnabled, query)
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
  const renderedProfileId = useActiveProfileId()

  return withQueryOptionsAuthentication(
    options,
    isAuthenticated ? renderedProfileId : undefined,
  )
}
