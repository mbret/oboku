import { switchMap } from "rxjs"
import { latestDatabase$ } from "../rxdb/useCreateDatabase"
import { useObserve } from "reactjrx"

export const useDataSource = (id: string) =>
  useObserve(
    () =>
      latestDatabase$.pipe(
        switchMap((db) => {
          return db.datasource.findOne({ selector: { _id: id } }).$
        })
      ),
    [id]
  )
