import type { ReactReaderProviderProps } from "@prose-reader/react-reader"
import { useAnnotations } from "../../annotations/useAnnotations"
import {
  applyAnnotationWrite,
  usePendingAnnotationWrites,
  useWriteAnnotation,
} from "../../annotations/useWriteAnnotation"
import { generateId } from "../../rxdb/collections/utils"

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
  const { data: storedAnnotations } = useAnnotations({ bookId, enabled })
  const pendingWrites = usePendingAnnotationWrites({ bookId })
  const { mutate: writeAnnotation } = useWriteAnnotation({ bookId })

  if (!enabled) return {}

  return {
    annotations:
      storedAnnotations &&
      pendingWrites.reduce(applyAnnotationWrite, storedAnnotations),
    onAnnotationCreate: function writeCreatedAnnotation(annotation) {
      writeAnnotation({
        type: "create",
        annotation: { ...annotation, id: generateId() },
      })
    },
    onAnnotationUpdate: function writeUpdatedAnnotation(annotation) {
      writeAnnotation({ type: "update", annotation })
    },
    onAnnotationDelete: function writeRemovedAnnotation(id) {
      writeAnnotation({ type: "remove", id })
    },
  }
}
