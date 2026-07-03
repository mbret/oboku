import {
  defaultShouldDehydrateQuery,
  type Query,
  type UseQueryOptions,
} from "@tanstack/react-query"

declare module "@tanstack/react-query" {
  interface Register {
    queryMeta: {
      /**
       * The query is not tied to the signed-in user (deployment-level data, e.g.
       * the web config). It is excluded from the per-user-session reset on
       * sign-out / account switch and re-saved so it stays available on the
       * signed-out screens.
       */
      persistAcrossSessions?: boolean
      /**
       * Persist the query in the offline cache regardless of its fetch state.
       * The default only persists `success` queries, so a query that drops to
       * `error` after a failed refetch would otherwise be evicted from the
       * snapshot and lost on the next (offline) boot. Only takes effect once the
       * query has a value to persist; `refetchOnMount` refreshes it once back
       * online.
       */
      alwaysPersist?: boolean
    }
  }
}

export const API_QUERY_KEY_PREFIX = "api" as const
export const RXDB_QUERY_KEY_PREFIX = "rxdb" as const

export const shouldAlwaysPersistQuery = (query: Query) =>
  !!query.meta?.alwaysPersist && query.state.data !== undefined

/**
 * Whether a query's current state is worth writing to the offline cache: a
 * successful query, or one that opted into `alwaysPersist` and still holds a
 * last-good value. Callers add their own scope (API-backed vs session-surviving).
 */
export const shouldPersistQueryState = (query: Query) =>
  defaultShouldDehydrateQuery(query) || shouldAlwaysPersistQuery(query)

export const createRxdbQueryDefaultOptions = (): Pick<
  UseQueryOptions,
  "networkMode"
> => ({
  // they run on local database, never on network so they have no network constraints.
  networkMode: "always",
})
