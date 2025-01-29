import { map, switchMap } from "rxjs"
import { latestDatabase$ } from "../rxdb/RxDbProvider"
import { useQuery$ } from "reactjrx"

export const useDataSource = (id: string) =>
  useQuery$({
    queryKey: ["rxdb", "dataSource", id],
    queryFn: () =>
      latestDatabase$.pipe(
        switchMap((db) => {
          return db.datasource.findOne({ selector: { _id: id } }).$
        }),
        map((entry) => entry?.toJSON())
      )
  })
