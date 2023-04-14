import { catchError, switchMap, of, from, mergeMap } from "rxjs"
import { useSubscribe } from "reactjrx"
import { latestDatabase$ } from "../rxdb/useCreateDatabase"
import { toggleDatasourceProtected$ } from "./triggers"
import { isNotNullOrUndefined } from "../common/rxjs/isNotNullOrUndefined"
import { Report } from "../debug/report.shared"

const useToggleDataSourceProtectedAction = () => {
  useSubscribe(
    () =>
      latestDatabase$.pipe(
        switchMap((db) =>
          toggleDatasourceProtected$.pipe(
            mergeMap((id) =>
              from(
                db.datasource.findOne({ selector: { _id: id } }).exec()
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
    []
  )
}

export const effects = [useToggleDataSourceProtectedAction]
