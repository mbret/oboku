import {
  catchError,
  switchMap,
  from,
  mergeMap,
  EMPTY,
  withLatestFrom
} from "rxjs"
import { useSubscribeEffect } from "reactjrx"
import { latestDatabase$ } from "../rxdb/useCreateDatabase"
import { toggleDatasourceProtected$ } from "./triggers"
import { isNotNullOrUndefined } from "../common/isNotNullOrUndefined"
import { Report } from "../debug/report.shared"

const useToggleDataSourceProtectedAction = () => {
  useSubscribeEffect(
    () =>
      toggleDatasourceProtected$.pipe(
        withLatestFrom(latestDatabase$),
        mergeMap(([id, db]) =>
          from(db.datasource.findOne({ selector: { _id: id } }).exec()).pipe(
            isNotNullOrUndefined(),
            switchMap((doc) =>
              from(
                doc?.atomicPatch({
                  isProtected: !doc.isProtected
                })
              )
            ),
            catchError((err) => {
              Report.error(err)

              return EMPTY
            })
          )
        )
      ),
    []
  )
}

export const effects = [useToggleDataSourceProtectedAction]
