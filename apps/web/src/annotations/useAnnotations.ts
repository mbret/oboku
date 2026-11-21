import type { Annotation } from "@prose-reader/enhancer-annotations"
import { type DefaultError, queryOptions } from "@tanstack/react-query"
import { useLiveQuery$ } from "reactjrx"
import { map, switchMap } from "rxjs"
import {
  createRxdbQueryDefaultOptions,
  RXDB_QUERY_KEY_PREFIX,
} from "../queries/queryClient"
import type { RxdbAnnotationDocType } from "../rxdb/collections/annotation"
import { latestDatabase$ } from "../rxdb/RxDbProvider"

/**
 * An annotation with the keys of the list `useAnnotations` gives. A stored
 * list equal to a list of these keeps its identity.
 */
export const toListedAnnotation = ({
  id,
  cfi,
  highlightedText,
  highlightColor,
  notes,
}: Annotation): Annotation => ({
  id,
  cfi,
  highlightedText,
  highlightColor,
  notes,
})

const toAnnotation = (
  document: Pick<
    RxdbAnnotationDocType,
    "_id" | "cfi" | "highlightedText" | "highlightColor" | "notes"
  >,
): Annotation =>
  toListedAnnotation({
    id: document._id,
    cfi: document.cfi,
    highlightedText: document.highlightedText ?? undefined,
    highlightColor: document.highlightColor ?? undefined,
    notes: document.notes ?? undefined,
  })

const createAnnotationsQueryKey = (bookId: string) =>
  [RXDB_QUERY_KEY_PREFIX, "annotations", { bookId }] as const

export const createAnnotationsQueryOptions = (bookId: string) =>
  queryOptions<
    Annotation[],
    DefaultError,
    Annotation[],
    ReturnType<typeof createAnnotationsQueryKey>
  >({
    ...createRxdbQueryDefaultOptions(),
    queryKey: createAnnotationsQueryKey(bookId),
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
    ...createAnnotationsQueryOptions(bookId),
    enabled,
    queryFn: function observeAnnotationsOfBook() {
      return latestDatabase$.pipe(
        switchMap(function observeAnnotationsOfBookIn(database) {
          return database.annotation.find({
            selector: { bookId },
            sort: [{ createdAt: "asc" }],
          }).$
        }),
        map(function toAnnotationsOfBook(documents) {
          return documents.map(toAnnotation)
        }),
      )
    },
  })
