import { useQuery$ } from "reactjrx"
import {
  createRxdbQueryDefaultOptions,
  RXDB_QUERY_KEY_PREFIX,
} from "../queries/queryClient"
import { latestDatabase$ } from "../rxdb/RxDbProvider"
import { map, switchMap } from "rxjs"

export const useSettings = (options: { enabled?: boolean } = {}) => {
  const data = useQuery$({
    ...createRxdbQueryDefaultOptions(),
    queryKey: [RXDB_QUERY_KEY_PREFIX, "settings"],
    queryFn: () =>
      latestDatabase$.pipe(
        switchMap((db) =>
          db.settings.findOne().$.pipe(map((entry) => entry?.toJSON())),
        ),
      ),
    /**
     * We always want instant feedback for these settings for the user.
     * Since the query is a live stream the data are always fresh anyway.
     */
    gcTime: Infinity,
    staleTime: Infinity,
    ...options,
  })

  return data
}
