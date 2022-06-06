import { Database, useDatabase } from "../rxdb"
import { bind } from "@react-rxjs/core"
import { of, switchMap } from "rxjs"
import { isNotNullOrUndefined } from "../common/rxjs/isNotNullOrUndefined"
import { useRecoilValue } from "recoil"
import { libraryState } from "../library/states"

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
  const db = useDatabase()
  const { isLibraryUnlocked } = useRecoilValue(libraryState)

  return useData(db, isLibraryUnlocked)
}
