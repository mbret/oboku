import { map, switchMap } from "rxjs"
import { latestDatabase$ } from "../rxdb/useCreateDatabase"
import { useQuery } from "reactjrx"

export const useDataSource = (id: string) =>
  useQuery({
    queryKey: ["dataSource", id],
    staleTime: Infinity,
    queryFn: () =>
      latestDatabase$.pipe(
        switchMap((db) => {
          return db.datasource.findOne({ selector: { _id: id } }).$
        }),
        map((entry) => entry?.toJSON())
      )
  })
