import {
  type Query,
  type QueryClient,
  useQueryClient,
} from "@tanstack/react-query"
import { persistQueryClientSave } from "@tanstack/react-query-persist-client"
import { persistBuster, persister } from "./persister"
import { shouldPersistQueryState } from "./queryClient"

/**
 * Resets the query-side session state, shared by sign-out and account switch.
 *
 * Prefer `resetQueries` over `clear`: `clear` removes every query and cancels
 * in-flight work, but mounted observers may not run a new fetch right away,
 * which can leave screens stuck until remount. `resetQueries` resets state and
 * refetches **active** queries (still skipped when `enabled` is false after
 * auth clears). Mutations are cleared separately because `resetQueries` only
 * touches the query cache.
 *
 * Queries tagged `meta.survivesSessionReset` are app-global (not session data)
 * and must stay available for the signed-out screens (e.g. the web config
 * powering the Google sign-in button), so they are excluded from the reset.
 *
 * A reload right after sign-out must not resurface the previous session's
 * cached data, and the provider's throttled auto-persist may not have flushed
 * by then. So we force an immediate save that atomically overwrites the snapshot
 * with only the global queries that opt into persistence, dropping the session
 * data. The web config never opts into the snapshot — it owns its offline
 * cache — so it stays available to `LoadConfiguration` regardless.
 *
 * `keepQuery` preserves extra queries from the reset. On account switch it
 * keeps the (already-updated) active-profile query so `hasSession` never blinks
 * empty mid-switch and unmounts the authenticated UI.
 */
export const resetSessionQueries = (
  queryClient: QueryClient,
  { keepQuery }: { keepQuery?: (query: Query) => boolean } = {},
) => {
  void queryClient.resetQueries({
    predicate: (query) =>
      !query.meta?.survivesSessionReset && !keepQuery?.(query),
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
