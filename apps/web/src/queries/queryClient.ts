import {
  defaultShouldDehydrateQuery,
  type Query,
  type UseQueryOptions,
} from "@tanstack/react-query"

declare module "@tanstack/react-query" {
  interface Register {
    queryMeta: {
      /**
       * The query is not tied to the signed-in session (deployment-level data
       * like the web config, or device-level data like the profiles list), so
       * it is excluded from the per-user-session reset on sign-out / account
       * switch and stays available on the signed-out screens.
       */
      survivesSessionReset?: boolean
      /**
       * Opt this query into the shared react-query offline snapshot. The
       * snapshot is busted on every release, so it is a warm-start nicety, not
       * durable storage — queries that own their durability elsewhere (rxdb,
       * the web config's dedicated cache) simply don't opt in.
       *
       * Invariant: a persisted query that is per-user session data (not
       * `survivesSessionReset`) MUST scope its key by the active profile id.
       * The sign-out scrub drops session data from the snapshot, but a reload
       * can beat it; an unscoped session key then lets the previous user's
       * cache resurface for the next profile on a shared device, while a
       * profile-scoped key reads a different slot per profile and cannot mix.
       * See `notifications/inbox/queryKeys` for the reference pattern; the
       * persister's dev guard flags violations of this rule.
       */
      persist?: boolean
    }
  }
}

export const API_QUERY_KEY_PREFIX = "api" as const
export const RXDB_QUERY_KEY_PREFIX = "rxdb" as const

/**
 * Whether a query's current state is worth writing to the shared offline
 * snapshot: a successful query that has opted in via `meta.persist`.
 * Callers add their own scope where needed (e.g. session-surviving only).
 */
export const shouldPersistQueryState = (query: Query) =>
  !!query.meta?.persist && defaultShouldDehydrateQuery(query)

export const createRxdbQueryDefaultOptions = (): Pick<
  UseQueryOptions,
  "networkMode"
> => ({
  // they run on local database, never on network so they have no network constraints.
  networkMode: "always",
})
