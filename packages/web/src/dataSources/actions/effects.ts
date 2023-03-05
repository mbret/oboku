import { bind } from "@react-rxjs/core"
import { catchError, switchMap, of, from } from "rxjs"
import { toggleDatasourceProtected$ } from "."
import { isNotNullOrUndefined } from "../../common/rxjs/isNotNullOrUndefined"
import { Report } from "../../debug/report.shared"
import { Database, useDatabase } from "../../rxdb"

const [useToggleDataSourceProtectedAction] = bind(
  (maybeDb: Database | undefined) =>
    of(maybeDb).pipe(
      isNotNullOrUndefined(),
      switchMap((db) =>
        toggleDatasourceProtected$.pipe(
          switchMap((id) =>
            from(db.datasource.findOne({ selector: { _id: id } }).exec()).pipe(
              isNotNullOrUndefined(),
              switchMap((doc) =>
                from(
                  doc?.atomicPatch({
                    isProtected: !doc.isProtected
                  })
                )
              )
            )
          ),
          catchError((err) => {
            Report.error(err)

            return of(undefined)
          })
        )
      )
    ),
  undefined
)

export const useDataSourceEffects = () => {
  const { db } = useDatabase()

  useToggleDataSourceProtectedAction(db)
}
