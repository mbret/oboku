import type { Annotation } from "@prose-reader/enhancer-annotations"
import { useLiveQuery$ } from "reactjrx"
import { map, switchMap } from "rxjs"
import {
  createRxdbQueryDefaultOptions,
  RXDB_QUERY_KEY_PREFIX,
} from "../queries/queryClient"
import type { RxdbAnnotationDocType } from "../rxdb/collections/annotation"
import { latestDatabase$ } from "../rxdb/RxDbProvider"

const toAnnotation = (
  document: Pick<
    RxdbAnnotationDocType,
    "_id" | "cfi" | "highlightedText" | "highlightColor" | "notes"
  >,
): Annotation => ({
  id: document._id,
  cfi: document.cfi,
  highlightedText: document.highlightedText ?? undefined,
  highlightColor: document.highlightColor ?? undefined,
  notes: document.notes ?? undefined,
})

/**
 * The list keeps its identity while no annotation of the book changes:
 * react-reader draws the highlights again for each new one.
 */
export const useAnnotations = ({
  bookId,
  enabled,
}: {
  bookId: string
  enabled: boolean
}) =>
  useLiveQuery$({
    ...createRxdbQueryDefaultOptions(),
    queryKey: [RXDB_QUERY_KEY_PREFIX, "annotations", { bookId }],
    enabled,
    queryFn: function observeAnnotationsOfBook() {
      return latestDatabase$.pipe(
        switchMap(function observeAnnotationsOfBookIn(database) {
          return database.annotation.find({
            selector: { bookId },
            sort: [{ createdAt: "asc" }],
          }).$
        }),
        map((documents) => documents.map(toAnnotation)),
      )
    },
  })
