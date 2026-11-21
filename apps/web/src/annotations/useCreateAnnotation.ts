import type { Annotation } from "@prose-reader/enhancer-annotations"
import { toListedAnnotation } from "./useAnnotations"
import { useAnnotationsWrite } from "./useAnnotationsWrite"

export const useCreateAnnotation = ({ bookId }: { bookId: string }) =>
  useAnnotationsWrite({
    bookId,
    write: function insertAnnotation(database, annotation: Annotation) {
      return database.annotation.insert({
        _id: annotation.id,
        rx_model: "annotation",
        bookId,
        cfi: annotation.cfi,
        highlightColor: annotation.highlightColor ?? null,
        notes: annotation.notes ?? null,
        highlightedText: annotation.highlightedText ?? null,
        createdAt: new Date().toISOString(),
        modifiedAt: null,
      })
    },
    changeList: function addAnnotation(annotations, annotation) {
      return [...annotations, toListedAnnotation(annotation)]
    },
  })
