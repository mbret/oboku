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
 * Queries tagged `meta.persistAcrossSessions` are app-global (not session data)
 * and must stay available for the signed-out screens (e.g. the web config
 * powering the Google sign-in button), so they are excluded from the reset.
 *
 * The persisted client cannot simply be dropped: the config lives in the same
 * persister, and wiping it would leave `LoadConfiguration` without data on an
 * offline reload (or while `/web/config` is unavailable). Relying on the
 * provider's throttled auto-persist is not enough either — a reload before it
 * flushes would rehydrate the pre-reset snapshot and resurface the previous
 * session's cached data. So we force an immediate save of the global queries
 * only, which atomically drops the persisted session data while keeping the
 * config for rehydration.
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
      !query.meta?.persistAcrossSessions && !keepQuery?.(query),
  })
  queryClient.getMutationCache().clear()

  void persistQueryClientSave({
    queryClient,
    persister,
    buster: persistBuster,
    dehydrateOptions: {
      shouldDehydrateQuery: (query) =>
        !!query.meta?.persistAcrossSessions && shouldPersistQueryState(query),
      shouldDehydrateMutation: () => false,
    },
  })
}

export const useResetSessionQueries = () => {
  const queryClient = useQueryClient()

  return () => resetSessionQueries(queryClient)
}
