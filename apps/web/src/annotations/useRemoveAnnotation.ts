import { useMutation$ } from "reactjrx"
import { from, mergeMap } from "rxjs"
import { getLatestDatabase } from "../rxdb/RxDbProvider"

export const useRemoveAnnotation = () =>
  useMutation$({
    mutationFn: function removeAnnotation(id: string) {
      return getLatestDatabase().pipe(
        mergeMap(function removeAnnotationFrom(database) {
          return from(database.annotation.findOne(id).incrementalRemove())
        }),
      )
    },
  })
