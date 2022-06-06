import { bind } from "@react-rxjs/core"
import { catchError, switchMap, of, from } from "rxjs"
import { ofType } from "../../actions"
import { actionSubject$ } from "../../actions/actionSubject$"
import { isNotNullOrUndefined } from "../../common/rxjs/isNotNullOrUndefined"
import { Report } from "../../debug/report.shared"
import { Database, useDatabase } from "../../rxdb"

const [useToggleDataSourceProtectedAction] = bind(
  (maybeDb: Database | undefined) =>
    of(maybeDb).pipe(
      isNotNullOrUndefined(),
      switchMap((db) =>
        actionSubject$.pipe(
          ofType(`TOGGLE_DATASOURCE_PROTECTED`),
          switchMap((data) =>
            from(
              db.datasource.findOne({ selector: { _id: data.data.id } }).exec()
            ).pipe(
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
  const db = useDatabase()

  useToggleDataSourceProtectedAction(db)
}
