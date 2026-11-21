import type { ReactReaderProviderProps } from "@prose-reader/react-reader"
import { useAnnotations } from "../../annotations/useAnnotations"
import { useCreateAnnotation } from "../../annotations/useCreateAnnotation"
import { useDeleteAnnotation } from "../../annotations/useDeleteAnnotation"
import { useUpdateAnnotation } from "../../annotations/useUpdateAnnotation"

type ReaderAnnotations = Pick<
  ReactReaderProviderProps,
  | "annotations"
  | "onAnnotationCreate"
  | "onAnnotationUpdate"
  | "onAnnotationDelete"
>

/**
 * The annotations of the book for `ReactReaderProvider`, with the handlers
 * that store what react-reader reports. None when `enabled` is `false`.
 */
export const useReaderAnnotations = ({
  bookId,
  enabled,
}: {
  bookId: string
  enabled: boolean
}): ReaderAnnotations => {
  const { data: annotations } = useAnnotations({ bookId, enabled })
  const { mutate: createAnnotation } = useCreateAnnotation()
  const { mutate: updateAnnotation } = useUpdateAnnotation()
  const { mutate: deleteAnnotation } = useDeleteAnnotation()

  if (!enabled) return {}

  return {
    annotations,
    onAnnotationCreate: function storeCreatedAnnotation(annotation) {
      createAnnotation({ bookId, annotation })
    },
    onAnnotationUpdate: function storeUpdatedAnnotation(annotation) {
      updateAnnotation(annotation)
    },
    onAnnotationDelete: function deleteStoredAnnotation(id) {
      deleteAnnotation(id)
    },
  }
}
