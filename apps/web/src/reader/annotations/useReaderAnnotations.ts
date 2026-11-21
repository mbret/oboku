import type { ReactReaderProviderProps } from "@prose-reader/react-reader"
import { useAnnotations } from "../../annotations/useAnnotations"
import { useCreateAnnotation } from "../../annotations/useCreateAnnotation"
import { useRemoveAnnotation } from "../../annotations/useRemoveAnnotation"
import { useUpdateAnnotation } from "../../annotations/useUpdateAnnotation"

type ReaderAnnotations = Pick<
  ReactReaderProviderProps,
  | "annotations"
  | "onAnnotationCreate"
  | "onAnnotationUpdate"
  | "onAnnotationDelete"
>

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
  const { mutate: removeAnnotation } = useRemoveAnnotation()

  if (!enabled) return {}

  return {
    annotations,
    onAnnotationCreate: function storeCreatedAnnotation(annotation) {
      createAnnotation({ bookId, annotation })
    },
    onAnnotationUpdate: updateAnnotation,
    onAnnotationDelete: removeAnnotation,
  }
}
