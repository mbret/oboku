import { useMutation$ } from "reactjrx"
import { getLatestDatabase } from "../rxdb/RxDbProvider"
import { from, switchMap } from "rxjs"
import { throwIfNotDefined } from "../common/rxjs/operators"

export const useRemoveTag = () => {
  return useMutation$({
    mutationFn: ({ _id }: { _id: string }) =>
      getLatestDatabase().pipe(
        switchMap((db) => from(db.tag.findOne(_id).exec())),
        throwIfNotDefined,
        switchMap((item) => from(item.incrementalRemove())),
      ),
  })
}
