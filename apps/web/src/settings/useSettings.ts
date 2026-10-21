import { useLiveQuery$ } from "reactjrx"
import {
  createRxdbQueryDefaultOptions,
  RXDB_QUERY_KEY_PREFIX,
} from "../queries/queryClient"
import { latestDatabase$ } from "../rxdb/RxDbProvider"
import { map, switchMap } from "rxjs"

export const useSettings = (options: { enabled?: boolean } = {}) => {
  const data = useLiveQuery$({
    ...createRxdbQueryDefaultOptions(),
    queryKey: [RXDB_QUERY_KEY_PREFIX, "settings"],
    queryFn: () =>
      latestDatabase$.pipe(
        switchMap((db) =>
          db.settings.findOne().$.pipe(map((entry) => entry?.toJSON() ?? null)),
        ),
      ),
    /**
     * We always want instant feedback for these settings for the user.
     */
    gcTime: Infinity,
    ...options,
  })

  return data
}
