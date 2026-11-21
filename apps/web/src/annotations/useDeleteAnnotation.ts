import { useMutation$ } from "reactjrx"
import { from, mergeMap } from "rxjs"
import { throwIfNotDefined } from "../common/rxjs/operators"
import { getLatestDatabase } from "../rxdb/RxDbProvider"

export const useDeleteAnnotation = () =>
  useMutation$({
    mutationFn: function removeAnnotation(id: string) {
      return getLatestDatabase().pipe(
        mergeMap((database) => from(database.annotation.findOne(id).exec())),
        throwIfNotDefined,
        mergeMap((annotation) => from(annotation.remove())),
      )
    },
  })
