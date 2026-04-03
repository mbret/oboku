import { map, switchMap } from "rxjs"
import { latestDatabase$ } from "../rxdb/RxDbProvider"
import { useQuery$ } from "reactjrx"
import { RXDB_QUERY_KEY_PREFIX } from "../queries/queryClient"

export const useDataSource = (id?: string) =>
  useQuery$({
    queryKey: [RXDB_QUERY_KEY_PREFIX, "dataSource", id ?? "-1"],
    enabled: !!id,
    queryFn: () =>
      latestDatabase$.pipe(
        switchMap((db) => {
          return db.datasource.findOne({ selector: { _id: id } }).$
        }),
        map((entry) => entry?.toJSON() ?? null),
      ),
  })
