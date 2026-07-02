import { useQueryClient } from "@tanstack/react-query"
import { persister } from "./persister"

/**
 * Resets the query-side session state, e.g. on sign-out.
 *
 * Prefer `resetQueries` over `clear`: `clear` removes every query and cancels
 * in-flight work, but mounted observers may not run a new fetch right away,
 * which can leave screens stuck until remount. `resetQueries` resets state and
 * refetches **active** queries (still skipped when `enabled` is false after
 * auth clears). Mutations are cleared separately because `resetQueries` only
 * touches the query cache, and the persisted client is dropped so nothing
 * rehydrates on reload.
 *
 * Queries tagged `meta.persistAcrossSessions` are app-global (not session
 * data) and must stay available for the signed-out screens (e.g. the web
 * config powering the Google sign-in button), so they are excluded.
 */
export const useResetSessionQueries = () => {
  const queryClient = useQueryClient()

  return () => {
    void queryClient.resetQueries({
      predicate: (query) => !query.meta?.persistAcrossSessions,
    })
    queryClient.getMutationCache().clear()
    void persister.removeClient()
  }
}
