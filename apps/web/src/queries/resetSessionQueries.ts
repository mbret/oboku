import { type QueryClient, useQueryClient } from "@tanstack/react-query"
import { persistQueryClientSave } from "@tanstack/react-query-persist-client"
import { persistBuster, persister } from "./persister"
import { shouldPersistQueryState } from "./queryClient"

/**
 * Resets the query-side session state, shared by sign-out and account switch.
 *
 * Prefer `resetQueries` over `clear`: `clear` removes every query and cancels
 * in-flight work, but mounted observers may not run a new fetch right away,
 * which can leave screens stuck until remount. `resetQueries` resets state and
 * refetches **active** queries. Mutations are cleared separately because
 * `resetQueries` only touches the query cache.
 *
 * The refetch runs before observers re-render with the new auth state, so a
 * plain `enabled: isAuthenticated` cannot exclude a query from it — on
 * sign-out that would fire authenticated endpoints without credentials.
 * Queries that require a session must wrap their options in
 * `useQueryOptionsWithAuthentication`, whose `enabled` resolves against the
 * live session at refetch time. Account switch commits the new session
 * *before* resetting
 * (see `completeAuthentication`), so those queries refetch with the new token.
 *
 * Queries tagged `meta.survivesSessionReset` are not session data and must
 * stay available across the reset (e.g. the web config powering the Google
 * sign-in button on the signed-out screens, or the device-scoped profiles
 * query that `hasSession` derives from — resetting it mid-account-switch
 * would blink `hasSession` empty and unmount the authenticated UI), so they
 * are excluded from the reset.
 *
 * A reload right after sign-out must not resurface the previous session's
 * cached data, and the provider's throttled auto-persist may not have flushed
 * by then. So we force an immediate save that atomically overwrites the snapshot
 * with only the global queries that opt into persistence, dropping the session
 * data. The web config never opts into the snapshot — it owns its offline
 * cache — so it stays available to `LoadConfiguration` regardless.
 */
export const resetSessionQueries = (queryClient: QueryClient) => {
  void queryClient.resetQueries({
    predicate: (query) => !query.meta?.survivesSessionReset,
  })
  queryClient.getMutationCache().clear()

  void persistQueryClientSave({
    queryClient,
    persister,
    buster: persistBuster,
    dehydrateOptions: {
      shouldDehydrateQuery: (query) =>
        !!query.meta?.survivesSessionReset && shouldPersistQueryState(query),
      shouldDehydrateMutation: () => false,
    },
  })
}

export const useResetSessionQueries = () => {
  const queryClient = useQueryClient()

  return () => resetSessionQueries(queryClient)
}
