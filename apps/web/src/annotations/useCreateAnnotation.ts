import type { Annotation } from "@prose-reader/enhancer-annotations"
import { useMutation$ } from "reactjrx"
import { from, mergeMap } from "rxjs"
import { getLatestDatabase } from "../rxdb/RxDbProvider"

/**
 * Stores an annotation that react-reader reports, with the id it gave. An
 * annotation without text, such as a page bookmark, stores `null` as its
 * text.
 */
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
        mergeMap((database) =>
          from(
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
          ),
        ),
      )
    },
  })
