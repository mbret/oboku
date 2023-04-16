import { from, mergeMap, withLatestFrom } from "rxjs"
import { removeTag$ } from "./triggers"
import { useSubscribeEffect } from "reactjrx"
import { latestDatabase$ } from "../rxdb/useCreateDatabase"

export const useTagEffects = () => {
  useSubscribeEffect(
    () =>
      removeTag$.pipe(
        withLatestFrom(latestDatabase$),
        mergeMap(([{ id }, db]) =>
          from(db?.tag.findOne({ selector: { _id: id } }).remove())
        )
      ),
    []
  )
}
