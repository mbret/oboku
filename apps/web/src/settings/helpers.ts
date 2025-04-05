import { useQuery$ } from "reactjrx"
import { latestDatabase$ } from "../rxdb/RxDbProvider"
import { map, switchMap } from "rxjs"

export const useSettings = (
  options: {
    enabled?: boolean
  } = {},
) => {
  const data = useQuery$({
    queryKey: ["rxdb", "settings"],
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
