import { Database, useDatabase } from "../rxdb"
import { bind } from "@react-rxjs/core"
import { of, switchMap } from "rxjs"
import { isNotNullOrUndefined } from "../common/rxjs/isNotNullOrUndefined"

const [useData] = bind(
  (maybeDb: Database | undefined, id: string) =>
    of(maybeDb).pipe(
      isNotNullOrUndefined(),
      switchMap((db) => db.datasource.findOne({ selector: { _id: id } }).$)
    ),
  null
)

export const useDataSource = (id: string) => {
  const db = useDatabase()

  return useData(db, id)
}
