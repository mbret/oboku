import { Subject, from, mergeMap, withLatestFrom } from "rxjs"
import { useSubscribeEffect } from "reactjrx"
import { latestDatabase$ } from "../rxdb/useCreateDatabase"

export const removeTag = new Subject<{ id: string }>()

export const useTagEffects = () => {
  useSubscribeEffect(
    () =>
      removeTag.pipe(
        withLatestFrom(latestDatabase$),
        mergeMap(([{ id }, db]) =>
          from(db?.tag.findOne({ selector: { _id: id } }).remove())
        )
      ),
    []
  )
}
