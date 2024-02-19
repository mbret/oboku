import {
  catchError,
  switchMap,
  from,
  mergeMap,
  EMPTY,
  withLatestFrom,
  filter,
} from "rxjs"
import { isDefined, useSubscribeEffect } from "reactjrx"
import { latestDatabase$ } from "../rxdb/useCreateDatabase"
import { toggleDatasourceProtected$ } from "./triggers"
import { Report } from "../debug/report.shared"

const useToggleDataSourceProtectedAction = () => {
  useSubscribeEffect(
    () =>
      toggleDatasourceProtected$.pipe(
        withLatestFrom(latestDatabase$),
        mergeMap(([id, db]) =>
          from(db.datasource.findOne({ selector: { _id: id } }).exec()).pipe(
            filter(isDefined),
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
