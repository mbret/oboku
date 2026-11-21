import type { Annotation } from "@prose-reader/enhancer-annotations"
import { useMutation$ } from "reactjrx"
import { from, mergeMap } from "rxjs"
import { getLatestDatabase } from "../rxdb/RxDbProvider"

export const useCreateAnnotation = () =>
  useMutation$({
    mutationFn: function insertAnnotation({
      bookId,
      annotation,
    }: {
      bookId: string
      annotation: Annotation
    }) {
      return getLatestDatabase().pipe(
        mergeMap(function insertAnnotationIn(database) {
          return from(
            database.annotation.insert({
              _id: annotation.id,
              rx_model: "annotation",
              bookId,
              cfi: annotation.cfi,
              highlightColor: annotation.highlightColor ?? null,
              notes: annotation.notes ?? null,
              highlightedText: annotation.highlightedText ?? null,
              createdAt: new Date().toISOString(),
              modifiedAt: null,
            }),
          )
        }),
      )
    },
  })
