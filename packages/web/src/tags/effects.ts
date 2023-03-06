import { useEffect } from "react"
import { from, mergeMap, withLatestFrom, of } from "rxjs"
import { effect } from "../common/rxjs/effect"
import { isNotNullOrUndefined } from "../common/rxjs/isNotNullOrUndefined"
import { useDatabase } from "../rxdb"
import { removeTag$ } from "./actions"

export const useTagEffects = () => {
  const { db: database } = useDatabase()

  useEffect(
    () =>
      effect(removeTag$, (action$) =>
        action$.pipe(
          withLatestFrom(of(database).pipe(isNotNullOrUndefined())),
          mergeMap(([{ id }, db]) =>
            from(db?.tag.findOne({ selector: { _id: id } }).remove())
          )
        )
      ),
    [database]
  )
}
