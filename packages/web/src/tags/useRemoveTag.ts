import { useMutation } from "reactjrx"
import { latestDatabase$ } from "../rxdb/RxDbProvider"
import { first, from, of, switchMap } from "rxjs"

export const useRemoveTag = () => {
  return useMutation({
    mutationFn: ({ _id }: { _id: string }) =>
      latestDatabase$.pipe(
        first(),
        switchMap((db) => from(db.obokucollection.findOne(_id).exec())),
        switchMap((item) => (item ? from(item.incrementalRemove()) : of(null)))
      )
  })
}
