import { Database, useDatabase } from "../rxdb"
import { bind } from "@react-rxjs/core"
import { of, switchMap } from "rxjs"
import { isNotNullOrUndefined } from "../common/rxjs/isNotNullOrUndefined"
import { useLibraryState } from "../library/states"

const [useData] = bind(
  (maybeDb: Database | undefined, showProtected: boolean) =>
    of(maybeDb).pipe(
      isNotNullOrUndefined(),
      switchMap((db) => {
        if (showProtected) {
          return db.datasource.find().$
        }

        return db.datasource.find({ selector: { isProtected: { $ne: true } } })
          .$
      })
    ),
  []
)

export const useDataSources = () => {
  const { db } = useDatabase()
  const { isLibraryUnlocked } = useLibraryState()

  return useData(db, isLibraryUnlocked)
}
