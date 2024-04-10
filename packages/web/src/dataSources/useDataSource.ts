import { map, switchMap } from "rxjs"
import { latestDatabase$ } from "../rxdb/useCreateDatabase"
import { useForeverQuery } from "reactjrx"

export const useDataSource = (id: string) =>
  useForeverQuery({
    queryKey: ["rxdb", "dataSource", id],
    queryFn: () =>
      latestDatabase$.pipe(
        switchMap((db) => {
          return db.datasource.findOne({ selector: { _id: id } }).$
        }),
        map((entry) => entry?.toJSON())
      )
  })
